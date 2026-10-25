-- PulseMonitor: authentication (SQL Server)
-- Run AFTER 003_ServerSoftDelete.sql.
-- Upgrade script; safe to rerun.
--
-- 1. Renames the seeded 'Viewer' role to 'User' (the assessment's required role name).
-- 2. Adds RefreshTokens for JWT refresh-token rotation:
--    - only a SHA-256 hash of each token is stored, never the token itself;
--    - every refresh revokes the presented token and issues a new one in the same family;
--    - presenting an already-revoked token signals theft, and the whole family is revoked.

USE [PulseMonitorDb];
GO

-- Required for filtered indexes; some clients (e.g. ODBC sqlcmd) default QUOTED_IDENTIFIER to OFF.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'Viewer')
       AND NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'User')
    BEGIN
        UPDATE dbo.Roles
        SET RoleName = N'User',
            [Description] = N'Can view servers, metrics, alerts and reports'
        WHERE RoleName = N'Viewer';
    END;

    -- Databases where 002_SeedData.sql was never run.
    IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'User')
    BEGIN
        INSERT INTO dbo.Roles (RoleName, [Description])
        VALUES (N'User', N'Can view servers, metrics, alerts and reports');
    END;

    IF OBJECT_ID(N'dbo.RefreshTokens', N'U') IS NULL
    BEGIN
        CREATE TABLE [dbo].[RefreshTokens](
            [RefreshTokenId] [bigint] IDENTITY(1,1) NOT NULL,
            [UserId] [int] NOT NULL,
            -- Hex-encoded SHA-256 of the token sent to the client.
            [TokenHash] [char](64) NOT NULL,
            -- All tokens issued from one sign-in share a family.
            [FamilyId] [uniqueidentifier] NOT NULL,
            [CreatedAt] [datetime2](3) NOT NULL
                CONSTRAINT [DF_RefreshTokens_CreatedAt] DEFAULT (sysutcdatetime()),
            [ExpiresAt] [datetime2](3) NOT NULL,
            [RevokedAt] [datetime2](3) NULL,
            CONSTRAINT [PK_RefreshTokens] PRIMARY KEY CLUSTERED ([RefreshTokenId] ASC),
            CONSTRAINT [UQ_RefreshTokens_TokenHash] UNIQUE NONCLUSTERED ([TokenHash] ASC),
            CONSTRAINT [FK_RefreshTokens_Users] FOREIGN KEY ([UserId])
                REFERENCES [dbo].[Users] ([UserId]),
            CONSTRAINT [CK_RefreshTokens_Expiry] CHECK ([ExpiresAt] > [CreatedAt]),
            CONSTRAINT [CK_RefreshTokens_Revocation] CHECK ([RevokedAt] IS NULL OR [RevokedAt] >= [CreatedAt])
        );

        CREATE NONCLUSTERED INDEX [IX_RefreshTokens_UserId] ON [dbo].[RefreshTokens] ([UserId] ASC);
        CREATE NONCLUSTERED INDEX [IX_RefreshTokens_FamilyId] ON [dbo].[RefreshTokens] ([FamilyId] ASC);
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
