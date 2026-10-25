-- PulseMonitor: soft delete for servers (SQL Server)
-- Run AFTER 001_CreateSchema.sql and 002_SeedData.sql.
-- Upgrade script; safe to rerun.
--
-- Deleted servers keep their metric/alert/report history. DeletedAt marks them as
-- deleted; the server name becomes unique only among servers that are not deleted,
-- so a name can be reused after its server was deleted.

USE [PulseMonitorDb];
GO

-- Required for filtered indexes; some clients (e.g. ODBC sqlcmd) default QUOTED_IDENTIFIER to OFF.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF COL_LENGTH(N'dbo.Servers', N'DeletedAt') IS NULL
    BEGIN
        ALTER TABLE [dbo].[Servers] ADD [DeletedAt] [datetime2](3) NULL;
    END;

    IF OBJECT_ID(N'dbo.UQ_Servers_ServerName', N'UQ') IS NOT NULL
    BEGIN
        ALTER TABLE [dbo].[Servers] DROP CONSTRAINT [UQ_Servers_ServerName];
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

-- Separate batches: these statements reference the DeletedAt column added above.

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UX_Servers_ServerName_Active'
      AND object_id = OBJECT_ID(N'dbo.Servers'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UX_Servers_ServerName_Active] ON [dbo].[Servers]
    (
        [ServerName] ASC
    )
    WHERE ([DeletedAt] IS NULL);
END;
GO

-- A deleted server must never be monitored.
IF OBJECT_ID(N'dbo.CK_Servers_DeletedInactive', N'C') IS NULL
BEGIN
    ALTER TABLE [dbo].[Servers] ADD CONSTRAINT [CK_Servers_DeletedInactive]
        CHECK ([DeletedAt] IS NULL OR [IsActive] = 0);
END;
GO
