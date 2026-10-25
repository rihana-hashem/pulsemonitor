-- PulseMonitor database schema (SQL Server)
-- Database-first: schema scripts are the source of truth.
-- Run in SSMS/sqlcmd against a SQL Server instance where you have CREATE DATABASE permission.
-- This script creates a NEW database; it is not an upgrade script.

USE [master];
GO

CREATE DATABASE [PulseMonitorDb];
GO

USE [PulseMonitorDb];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE TABLE [dbo].[Alerts](
	[AlertId] [bigint] IDENTITY(1,1) NOT NULL,
	[ServerId] [int] NOT NULL,
	[MetricType] [nvarchar](50) NOT NULL,
	[ThresholdValue] [decimal](10, 2) NOT NULL,
	[TriggerValue] [decimal](10, 2) NOT NULL,
	[LastObservedValue] [decimal](10, 2) NULL,
	[Status] [nvarchar](20) NOT NULL,
	[TriggeredAt] [datetime2](3) NOT NULL,
	[LastObservedAt] [datetime2](3) NULL,
	[ResolvedAt] [datetime2](3) NULL,
 CONSTRAINT [PK_Alerts] PRIMARY KEY CLUSTERED 
(
	[AlertId] ASC
)
)
GO

CREATE TABLE [dbo].[DiskMetrics](
	[DiskMetricId] [bigint] IDENTITY(1,1) NOT NULL,
	[DiskId] [int] NOT NULL,
	[TotalSpaceMB] [bigint] NOT NULL,
	[FreeSpaceMB] [bigint] NOT NULL,
	[UsedPercentage] [decimal](5, 2) NOT NULL,
	[CollectedAt] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_DiskMetrics] PRIMARY KEY CLUSTERED 
(
	[DiskMetricId] ASC
)
)
GO

CREATE TABLE [dbo].[Disks](
	[DiskId] [int] IDENTITY(1,1) NOT NULL,
	[ServerId] [int] NOT NULL,
	[DriveLetter] [nvarchar](20) NOT NULL,
	[IsActive] [bit] NOT NULL,
 CONSTRAINT [PK_Disks] PRIMARY KEY CLUSTERED 
(
	[DiskId] ASC
),
 CONSTRAINT [UQ_Disks_Server_Drive] UNIQUE NONCLUSTERED 
(
	[ServerId] ASC,
	[DriveLetter] ASC
)
)
GO

CREATE TABLE [dbo].[Metrics](
	[MetricId] [bigint] IDENTITY(1,1) NOT NULL,
	[ServerId] [int] NOT NULL,
	[CpuUsage] [decimal](5, 2) NOT NULL,
	[MemoryUsage] [decimal](5, 2) NOT NULL,
	[DiskUsage] [decimal](5, 2) NOT NULL,
	[ResponseTimeMs] [int] NOT NULL,
	[Status] [nvarchar](20) NOT NULL,
	[CollectedAt] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_Metrics] PRIMARY KEY CLUSTERED 
(
	[MetricId] ASC
)
)
GO

CREATE TABLE [dbo].[Reports](
	[ReportId] [bigint] IDENTITY(1,1) NOT NULL,
	[ServerId] [int] NOT NULL,
	[RequestedByUserId] [int] NOT NULL,
	[StartDate] [datetime2](3) NOT NULL,
	[EndDate] [datetime2](3) NOT NULL,
	[Status] [nvarchar](20) NOT NULL,
	[FilePath] [nvarchar](1000) NULL,
	[ErrorMessage] [nvarchar](2000) NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
	[CompletedAt] [datetime2](3) NULL,
 CONSTRAINT [PK_Reports] PRIMARY KEY CLUSTERED 
(
	[ReportId] ASC
)
)
GO

CREATE TABLE [dbo].[Roles](
	[RoleId] [int] IDENTITY(1,1) NOT NULL,
	[RoleName] [nvarchar](50) NOT NULL,
	[Description] [nvarchar](250) NULL,
 CONSTRAINT [PK_Roles] PRIMARY KEY CLUSTERED 
(
	[RoleId] ASC
),
 CONSTRAINT [UQ_Roles_RoleName] UNIQUE NONCLUSTERED 
(
	[RoleName] ASC
)
)
GO

CREATE TABLE [dbo].[Servers](
	[ServerId] [int] IDENTITY(1,1) NOT NULL,
	[ServerName] [nvarchar](150) NOT NULL,
	[IpAddress] [varchar](45) NOT NULL,
	[Description] [nvarchar](500) NULL,
	[IsActive] [bit] NOT NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_Servers] PRIMARY KEY CLUSTERED 
(
	[ServerId] ASC
),
 CONSTRAINT [UQ_Servers_ServerName] UNIQUE NONCLUSTERED 
(
	[ServerName] ASC
)
)
GO

CREATE TABLE [dbo].[UserRoles](
	[UserId] [int] NOT NULL,
	[RoleId] [int] NOT NULL,
	[AssignedAt] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_UserRoles] PRIMARY KEY CLUSTERED 
(
	[UserId] ASC,
	[RoleId] ASC
)
)
GO

CREATE TABLE [dbo].[Users](
	[UserId] [int] IDENTITY(1,1) NOT NULL,
	[UserName] [nvarchar](100) NOT NULL,
	[Email] [nvarchar](256) NOT NULL,
	[PasswordHash] [nvarchar](500) NOT NULL,
	[IsActive] [bit] NOT NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED 
(
	[UserId] ASC
),
 CONSTRAINT [UQ_Users_Email] UNIQUE NONCLUSTERED 
(
	[Email] ASC
),
 CONSTRAINT [UQ_Users_UserName] UNIQUE NONCLUSTERED 
(
	[UserName] ASC
)
)
GO

CREATE NONCLUSTERED INDEX [IX_Alerts_ServerId_TriggeredAt] ON [dbo].[Alerts]
(
	[ServerId] ASC,
	[TriggeredAt] DESC
)
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_Alerts_Active] ON [dbo].[Alerts]
(
	[ServerId] ASC,
	[MetricType] ASC
)
WHERE ([Status]='Triggered')
GO

CREATE NONCLUSTERED INDEX [IX_DiskMetrics_DiskId_CollectedAt] ON [dbo].[DiskMetrics]
(
	[DiskId] ASC,
	[CollectedAt] DESC
)
GO

CREATE NONCLUSTERED INDEX [IX_Metrics_ServerId_CollectedAt] ON [dbo].[Metrics]
(
	[ServerId] ASC,
	[CollectedAt] DESC
)
GO

CREATE NONCLUSTERED INDEX [IX_Reports_RequestedBy_CreatedAt] ON [dbo].[Reports]
(
	[RequestedByUserId] ASC,
	[CreatedAt] DESC
)
GO

ALTER TABLE [dbo].[Alerts] ADD  CONSTRAINT [DF_Alerts_Status]  DEFAULT ('Triggered') FOR [Status]
GO

ALTER TABLE [dbo].[Alerts] ADD  CONSTRAINT [DF_Alerts_TriggeredAt]  DEFAULT (sysutcdatetime()) FOR [TriggeredAt]
GO

ALTER TABLE [dbo].[DiskMetrics] ADD  CONSTRAINT [DF_DiskMetrics_CollectedAt]  DEFAULT (sysutcdatetime()) FOR [CollectedAt]
GO

ALTER TABLE [dbo].[Disks] ADD  CONSTRAINT [DF_Disks_IsActive]  DEFAULT ((1)) FOR [IsActive]
GO

ALTER TABLE [dbo].[Metrics] ADD  CONSTRAINT [DF_Metrics_CollectedAt]  DEFAULT (sysutcdatetime()) FOR [CollectedAt]
GO

ALTER TABLE [dbo].[Reports] ADD  CONSTRAINT [DF_Reports_Status]  DEFAULT ('Pending') FOR [Status]
GO

ALTER TABLE [dbo].[Reports] ADD  CONSTRAINT [DF_Reports_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO

ALTER TABLE [dbo].[Servers] ADD  CONSTRAINT [DF_Servers_IsActive]  DEFAULT ((1)) FOR [IsActive]
GO

ALTER TABLE [dbo].[Servers] ADD  CONSTRAINT [DF_Servers_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO

ALTER TABLE [dbo].[UserRoles] ADD  CONSTRAINT [DF_UserRoles_AssignedAt]  DEFAULT (sysutcdatetime()) FOR [AssignedAt]
GO

ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_IsActive]  DEFAULT ((1)) FOR [IsActive]
GO

ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO

ALTER TABLE [dbo].[Alerts] ADD CONSTRAINT [FK_Alerts_Servers] FOREIGN KEY([ServerId])
REFERENCES [dbo].[Servers] ([ServerId])
GO

ALTER TABLE [dbo].[DiskMetrics] ADD CONSTRAINT [FK_DiskMetrics_Disks] FOREIGN KEY([DiskId])
REFERENCES [dbo].[Disks] ([DiskId])
GO

ALTER TABLE [dbo].[Disks] ADD CONSTRAINT [FK_Disks_Servers] FOREIGN KEY([ServerId])
REFERENCES [dbo].[Servers] ([ServerId])
GO

ALTER TABLE [dbo].[Metrics] ADD CONSTRAINT [FK_Metrics_Servers] FOREIGN KEY([ServerId])
REFERENCES [dbo].[Servers] ([ServerId])
GO

ALTER TABLE [dbo].[Reports] ADD CONSTRAINT [FK_Reports_Servers] FOREIGN KEY([ServerId])
REFERENCES [dbo].[Servers] ([ServerId])
GO

ALTER TABLE [dbo].[Reports] ADD CONSTRAINT [FK_Reports_Users] FOREIGN KEY([RequestedByUserId])
REFERENCES [dbo].[Users] ([UserId])
GO

ALTER TABLE [dbo].[UserRoles] ADD CONSTRAINT [FK_UserRoles_Roles] FOREIGN KEY([RoleId])
REFERENCES [dbo].[Roles] ([RoleId])
GO

ALTER TABLE [dbo].[UserRoles] ADD CONSTRAINT [FK_UserRoles_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([UserId])
GO

ALTER TABLE [dbo].[Alerts] ADD CONSTRAINT [CK_Alerts_Resolution] CHECK  (([Status]='Triggered' AND [ResolvedAt] IS NULL OR [Status]='Resolved' AND [ResolvedAt] IS NOT NULL AND [ResolvedAt]>=[TriggeredAt]))
GO

ALTER TABLE [dbo].[Alerts] ADD CONSTRAINT [CK_Alerts_Status] CHECK  (([Status]='Resolved' OR [Status]='Triggered'))
GO

ALTER TABLE [dbo].[DiskMetrics] ADD CONSTRAINT [CK_DiskMetrics_Space] CHECK  (([TotalSpaceMB]>(0) AND [FreeSpaceMB]>=(0) AND [FreeSpaceMB]<=[TotalSpaceMB]))
GO

ALTER TABLE [dbo].[DiskMetrics] ADD CONSTRAINT [CK_DiskMetrics_Usage] CHECK  (([UsedPercentage]>=(0) AND [UsedPercentage]<=(100)))
GO

ALTER TABLE [dbo].[Metrics] ADD CONSTRAINT [CK_Metrics_ResponseTime] CHECK  (([ResponseTimeMs]>=(0)))
GO

ALTER TABLE [dbo].[Metrics] ADD CONSTRAINT [CK_Metrics_Usage] CHECK  (([CpuUsage]>=(0) AND [CpuUsage]<=(100) AND ([MemoryUsage]>=(0) AND [MemoryUsage]<=(100)) AND ([DiskUsage]>=(0) AND [DiskUsage]<=(100))))
GO

ALTER TABLE [dbo].[Reports] ADD CONSTRAINT [CK_Reports_Completion] CHECK  (([Status]<>'Completed' OR [CompletedAt] IS NOT NULL AND [FilePath] IS NOT NULL))
GO

ALTER TABLE [dbo].[Reports] ADD CONSTRAINT [CK_Reports_DateRange] CHECK  (([StartDate]<[EndDate]))
GO

ALTER TABLE [dbo].[Reports] ADD CONSTRAINT [CK_Reports_Status] CHECK  (([Status]='Failed' OR [Status]='Completed' OR [Status]='Processing' OR [Status]='Pending'))
GO
