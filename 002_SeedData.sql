-- PulseMonitor sample/reference data (SQL Server)
-- Run AFTER 001_CreateSchema.sql.
-- Safe to rerun: seed records are identified by natural unique keys.
-- Development/demo use only. No real users or credentials are created.

USE [PulseMonitorDb];
GO

SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    -- Roles: RoleName has a unique constraint.
    INSERT INTO dbo.Roles (RoleName, [Description])
    SELECT seed.RoleName, seed.[Description]
    FROM (VALUES
        (N'Admin',  N'Can manage servers and monitoring settings'),
        (N'Viewer', N'Can view monitoring data and reports')
    ) AS seed(RoleName, [Description])
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.Roles AS r WHERE r.RoleName = seed.RoleName
    );

    -- Sample servers: ServerName has a unique constraint.
    INSERT INTO dbo.Servers (ServerName, IpAddress, [Description])
    SELECT seed.ServerName, seed.IpAddress, seed.[Description]
    FROM (VALUES
        (N'APP-SERVER-01', '192.0.2.10', N'Demo application server'),
        (N'DB-SERVER-01',  '192.0.2.20', N'Demo database server'),
        (N'WEB-SERVER-01', '192.0.2.30', N'Demo web server')
    ) AS seed(ServerName, IpAddress, [Description])
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.Servers AS s WHERE s.ServerName = seed.ServerName
    );

    -- Sample disks: unique constraint on (ServerId, DriveLetter).
    INSERT INTO dbo.Disks (ServerId, DriveLetter)
    SELECT s.ServerId, seed.DriveLetter
    FROM (VALUES
        (N'APP-SERVER-01', N'C:'),
        (N'APP-SERVER-01', N'D:'),
        (N'DB-SERVER-01',  N'C:'),
        (N'DB-SERVER-01',  N'E:'),
        (N'WEB-SERVER-01', N'C:')
    ) AS seed(ServerName, DriveLetter)
    INNER JOIN dbo.Servers AS s ON s.ServerName = seed.ServerName
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.Disks AS d
        WHERE d.ServerId = s.ServerId
          AND d.DriveLetter = seed.DriveLetter
    );

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

-- Metrics, DiskMetrics, Alerts, Reports and Users are deliberately not seeded.
-- Metrics will be produced by the monitoring job; alerts by the alert evaluator;
-- reports by the report workflow; users through a secure onboarding mechanism.
