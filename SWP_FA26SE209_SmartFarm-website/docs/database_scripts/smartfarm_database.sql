DROP PROCEDURE IF EXISTS `POMELO_BEFORE_DROP_PRIMARY_KEY`;
DELIMITER //
CREATE PROCEDURE `POMELO_BEFORE_DROP_PRIMARY_KEY`(IN `SCHEMA_NAME_ARGUMENT` VARCHAR(255), IN `TABLE_NAME_ARGUMENT` VARCHAR(255))
BEGIN
	DECLARE HAS_AUTO_INCREMENT_ID TINYINT(1);
	DECLARE PRIMARY_KEY_COLUMN_NAME VARCHAR(255);
	DECLARE PRIMARY_KEY_TYPE VARCHAR(255);
	DECLARE SQL_EXP VARCHAR(1000);
	SELECT COUNT(*)
		INTO HAS_AUTO_INCREMENT_ID
		FROM `information_schema`.`COLUMNS`
		WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
			AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
			AND `Extra` = 'auto_increment'
			AND `COLUMN_KEY` = 'PRI'
			LIMIT 1;
	IF HAS_AUTO_INCREMENT_ID THEN
		SELECT `COLUMN_TYPE`
			INTO PRIMARY_KEY_TYPE
			FROM `information_schema`.`COLUMNS`
			WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
				AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
				AND `COLUMN_KEY` = 'PRI'
			LIMIT 1;
		SELECT `COLUMN_NAME`
			INTO PRIMARY_KEY_COLUMN_NAME
			FROM `information_schema`.`COLUMNS`
			WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
				AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
				AND `COLUMN_KEY` = 'PRI'
			LIMIT 1;
		SET SQL_EXP = CONCAT('ALTER TABLE `', (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA())), '`.`', TABLE_NAME_ARGUMENT, '` MODIFY COLUMN `', PRIMARY_KEY_COLUMN_NAME, '` ', PRIMARY_KEY_TYPE, ' NOT NULL;');
		SET @SQL_EXP = SQL_EXP;
		PREPARE SQL_EXP_EXECUTE FROM @SQL_EXP;
		EXECUTE SQL_EXP_EXECUTE;
		DEALLOCATE PREPARE SQL_EXP_EXECUTE;
	END IF;
END //
DELIMITER ;

CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (
    `MigrationId` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `ProductVersion` varchar(32) CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK___EFMigrationsHistory` PRIMARY KEY (`MigrationId`)
) CHARACTER SET=utf8mb4;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    ALTER DATABASE CHARACTER SET utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    CREATE TABLE `FarmAreas` (
        `FarmAreaId` int NOT NULL AUTO_INCREMENT,
        `Name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
        `Description` varchar(255) CHARACTER SET utf8mb4 NULL,
        CONSTRAINT `PK_FarmAreas` PRIMARY KEY (`FarmAreaId`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    CREATE TABLE `Roles` (
        `RoleId` int NOT NULL AUTO_INCREMENT,
        `Name` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        CONSTRAINT `PK_Roles` PRIMARY KEY (`RoleId`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    CREATE TABLE `SeedVarieties` (
        `SeedVarietyId` int NOT NULL AUTO_INCREMENT,
        `Name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
        `Description` varchar(500) CHARACTER SET utf8mb4 NULL,
        `GrowthDays` int NOT NULL,
        `RentalPricePerTray` decimal(12,2) NOT NULL,
        `IsActive` tinyint(1) NOT NULL,
        CONSTRAINT `PK_SeedVarieties` PRIMARY KEY (`SeedVarietyId`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    CREATE TABLE `SoilTrays` (
        `SoilTrayId` int NOT NULL AUTO_INCREMENT,
        `Code` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `CurrentStatus` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `FarmAreaId` int NOT NULL,
        CONSTRAINT `PK_SoilTrays` PRIMARY KEY (`SoilTrayId`),
        CONSTRAINT `FK_SoilTrays_FarmAreas_FarmAreaId` FOREIGN KEY (`FarmAreaId`) REFERENCES `FarmAreas` (`FarmAreaId`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    CREATE TABLE `Users` (
        `UserId` int NOT NULL AUTO_INCREMENT,
        `Email` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
        `PasswordHash` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
        `FullName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
        `Phone` varchar(20) CHARACTER SET utf8mb4 NULL,
        `Address` varchar(255) CHARACTER SET utf8mb4 NULL,
        `IsActive` tinyint(1) NOT NULL,
        `RoleId` int NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `ResetToken` varchar(100) CHARACTER SET utf8mb4 NULL,
        `ResetTokenExpiresAt` datetime(6) NULL,
        `TokensValidFrom` datetime(6) NULL,
        CONSTRAINT `PK_Users` PRIMARY KEY (`UserId`),
        CONSTRAINT `FK_Users_Roles_RoleId` FOREIGN KEY (`RoleId`) REFERENCES `Roles` (`RoleId`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    CREATE TABLE `Orders` (
        `OrderId` int NOT NULL AUTO_INCREMENT,
        `OrderCode` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `UserId` int NOT NULL,
        `OrderType` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `Status` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `TotalAmount` decimal(12,2) NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `PaymentDueAt` datetime(6) NOT NULL,
        CONSTRAINT `PK_Orders` PRIMARY KEY (`OrderId`),
        CONSTRAINT `FK_Orders_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`UserId`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    CREATE TABLE `OrderItems` (
        `OrderItemId` int NOT NULL AUTO_INCREMENT,
        `OrderId` int NOT NULL,
        `ItemType` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `SeedVarietyId` int NOT NULL,
        `Quantity` int NOT NULL,
        `UnitPrice` decimal(12,2) NOT NULL,
        `LineTotal` decimal(12,2) NOT NULL,
        CONSTRAINT `PK_OrderItems` PRIMARY KEY (`OrderItemId`),
        CONSTRAINT `FK_OrderItems_Orders_OrderId` FOREIGN KEY (`OrderId`) REFERENCES `Orders` (`OrderId`) ON DELETE CASCADE,
        CONSTRAINT `FK_OrderItems_SeedVarieties_SeedVarietyId` FOREIGN KEY (`SeedVarietyId`) REFERENCES `SeedVarieties` (`SeedVarietyId`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    CREATE TABLE `TrayRentals` (
        `TrayRentalId` int NOT NULL AUTO_INCREMENT,
        `SoilTrayId` int NOT NULL,
        `SeedVarietyId` int NOT NULL,
        `OrderId` int NOT NULL,
        `StartDate` datetime(6) NOT NULL,
        `ExpectedHarvestDate` datetime(6) NOT NULL,
        `CropStatus` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        CONSTRAINT `PK_TrayRentals` PRIMARY KEY (`TrayRentalId`),
        CONSTRAINT `FK_TrayRentals_Orders_OrderId` FOREIGN KEY (`OrderId`) REFERENCES `Orders` (`OrderId`) ON DELETE CASCADE,
        CONSTRAINT `FK_TrayRentals_SeedVarieties_SeedVarietyId` FOREIGN KEY (`SeedVarietyId`) REFERENCES `SeedVarieties` (`SeedVarietyId`) ON DELETE CASCADE,
        CONSTRAINT `FK_TrayRentals_SoilTrays_SoilTrayId` FOREIGN KEY (`SoilTrayId`) REFERENCES `SoilTrays` (`SoilTrayId`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    INSERT INTO `Roles` (`RoleId`, `Name`)
    VALUES (1, 'ADMIN'),
    (2, 'STAFF'),
    (3, 'CUSTOMER');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    CREATE INDEX `IX_OrderItems_OrderId` ON `OrderItems` (`OrderId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    CREATE INDEX `IX_OrderItems_SeedVarietyId` ON `OrderItems` (`SeedVarietyId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    CREATE UNIQUE INDEX `IX_Orders_OrderCode` ON `Orders` (`OrderCode`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    CREATE INDEX `IX_Orders_UserId` ON `Orders` (`UserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    CREATE UNIQUE INDEX `IX_Roles_Name` ON `Roles` (`Name`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    CREATE UNIQUE INDEX `IX_SoilTrays_Code` ON `SoilTrays` (`Code`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    CREATE INDEX `IX_SoilTrays_FarmAreaId` ON `SoilTrays` (`FarmAreaId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    CREATE INDEX `IX_TrayRentals_OrderId` ON `TrayRentals` (`OrderId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    CREATE INDEX `IX_TrayRentals_SeedVarietyId` ON `TrayRentals` (`SeedVarietyId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    CREATE INDEX `IX_TrayRentals_SoilTrayId` ON `TrayRentals` (`SoilTrayId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    CREATE UNIQUE INDEX `IX_Users_Email` ON `Users` (`Email`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    CREATE INDEX `IX_Users_RoleId` ON `Users` (`RoleId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918045446_InitialCreate') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260918045446_InitialCreate', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918050307_AddTokenVersion') THEN

    ALTER TABLE `Users` DROP COLUMN `TokensValidFrom`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918050307_AddTokenVersion') THEN

    ALTER TABLE `Users` ADD `TokenVersion` int NOT NULL DEFAULT 0;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918050307_AddTokenVersion') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260918050307_AddTokenVersion', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918052350_AddRefreshTokens') THEN

    CREATE TABLE `RefreshTokens` (
        `RefreshTokenId` int NOT NULL AUTO_INCREMENT,
        `UserId` int NOT NULL,
        `TokenHash` varchar(128) CHARACTER SET utf8mb4 NOT NULL,
        `ExpiresAt` datetime(6) NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `RevokedAt` datetime(6) NULL,
        `ReplacedByTokenHash` varchar(128) CHARACTER SET utf8mb4 NULL,
        CONSTRAINT `PK_RefreshTokens` PRIMARY KEY (`RefreshTokenId`),
        CONSTRAINT `FK_RefreshTokens_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`UserId`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918052350_AddRefreshTokens') THEN

    CREATE UNIQUE INDEX `IX_RefreshTokens_TokenHash` ON `RefreshTokens` (`TokenHash`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918052350_AddRefreshTokens') THEN

    CREATE INDEX `IX_RefreshTokens_UserId` ON `RefreshTokens` (`UserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260918052350_AddRefreshTokens') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260918052350_AddRefreshTokens', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260920103032_AddEmailConfirmation') THEN

    ALTER TABLE `Users` ADD `EmailConfirmToken` varchar(100) CHARACTER SET utf8mb4 NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260920103032_AddEmailConfirmation') THEN

    ALTER TABLE `Users` ADD `EmailConfirmTokenExpiresAt` datetime(6) NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260920103032_AddEmailConfirmation') THEN

    ALTER TABLE `Users` ADD `EmailConfirmed` tinyint(1) NOT NULL DEFAULT FALSE;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260920103032_AddEmailConfirmation') THEN

    ALTER TABLE `Users` ADD `LastEmailSentAt` datetime(6) NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260920103032_AddEmailConfirmation') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260920103032_AddEmailConfirmation', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `OrderItems` DROP FOREIGN KEY `FK_OrderItems_SeedVarieties_SeedVarietyId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `Orders` DROP FOREIGN KEY `FK_Orders_Users_UserId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `SoilTrays` DROP FOREIGN KEY `FK_SoilTrays_FarmAreas_FarmAreaId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `TrayRentals` DROP FOREIGN KEY `FK_TrayRentals_SeedVarieties_SeedVarietyId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `Users` DROP FOREIGN KEY `FK_Users_Roles_RoleId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    DROP TABLE `FarmAreas`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    DROP TABLE `Roles`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    DROP TABLE `SeedVarieties`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `Users` DROP INDEX `IX_Users_RoleId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `TrayRentals` MODIFY COLUMN `TrayRentalId` int NOT NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CALL POMELO_BEFORE_DROP_PRIMARY_KEY(NULL, 'TrayRentals');
    ALTER TABLE `TrayRentals` DROP PRIMARY KEY;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `SoilTrays` DROP INDEX `IX_SoilTrays_FarmAreaId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `Users` DROP COLUMN `RoleId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `Users` RENAME COLUMN `Phone` TO `PhoneNumber`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `TrayRentals` RENAME COLUMN `SeedVarietyId` TO `SupplyId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `TrayRentals` RENAME COLUMN `TrayRentalId` TO `CustomerId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `TrayRentals` RENAME INDEX `IX_TrayRentals_SeedVarietyId` TO `IX_TrayRentals_SupplyId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `SoilTrays` RENAME COLUMN `FarmAreaId` TO `TierIndex`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `SoilTrays` RENAME COLUMN `Code` TO `TrayCode`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `SoilTrays` RENAME INDEX `IX_SoilTrays_Code` TO `IX_SoilTrays_TrayCode`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `Orders` RENAME COLUMN `UserId` TO `CustomerId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `Orders` RENAME COLUMN `Status` TO `OrderStatus`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `Orders` RENAME COLUMN `PaymentDueAt` TO `ExpiresAt`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `Orders` RENAME INDEX `IX_Orders_UserId` TO `IX_Orders_CustomerId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `OrderItems` RENAME COLUMN `SeedVarietyId` TO `SupplyId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `OrderItems` RENAME COLUMN `LineTotal` TO `Subtotal`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `OrderItems` RENAME INDEX `IX_OrderItems_SeedVarietyId` TO `IX_OrderItems_SupplyId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `Users` ADD `AvatarUrl` varchar(500) CHARACTER SET utf8mb4 NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `Users` ADD `Role` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT '';

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `TrayRentals` MODIFY COLUMN `CropStatus` varchar(30) CHARACTER SET utf8mb4 NOT NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `TrayRentals` MODIFY COLUMN `CustomerId` int NOT NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `TrayRentals` ADD `ActualHarvestDate` datetime(6) NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `SoilTrays` ADD `RackId` int NOT NULL DEFAULT 0;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `Orders` ADD `ShippingAddress` longtext CHARACTER SET utf8mb4 NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `TrayRentals` ADD `RentalId` int NOT NULL AUTO_INCREMENT, ADD CONSTRAINT `PK_TrayRentals` PRIMARY KEY (`RentalId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE TABLE `DailyTasks` (
        `TaskId` int NOT NULL AUTO_INCREMENT,
        `RentalId` int NOT NULL,
        `AssignedUserId` int NULL,
        `TaskName` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
        `DueDate` datetime(6) NOT NULL,
        `Status` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `CompletedAt` datetime(6) NULL,
        `Notes` varchar(500) CHARACTER SET utf8mb4 NULL,
        CONSTRAINT `PK_DailyTasks` PRIMARY KEY (`TaskId`),
        CONSTRAINT `FK_DailyTasks_TrayRentals_RentalId` FOREIGN KEY (`RentalId`) REFERENCES `TrayRentals` (`RentalId`) ON DELETE CASCADE,
        CONSTRAINT `FK_DailyTasks_Users_AssignedUserId` FOREIGN KEY (`AssignedUserId`) REFERENCES `Users` (`UserId`) ON DELETE SET NULL
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE TABLE `Deliveries` (
        `DeliveryId` int NOT NULL AUTO_INCREMENT,
        `OrderId` int NOT NULL,
        `RentalId` int NULL,
        `ShipperId` int NULL,
        `RecipientName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
        `RecipientPhone` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `ShippingAddress` longtext CHARACTER SET utf8mb4 NOT NULL,
        `TrackingCode` varchar(100) CHARACTER SET utf8mb4 NULL,
        `ActualWeightKg` float NULL,
        `DeliveryStatus` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `ShippedAt` datetime(6) NULL,
        `DeliveredAt` datetime(6) NULL,
        `Notes` longtext CHARACTER SET utf8mb4 NULL,
        CONSTRAINT `PK_Deliveries` PRIMARY KEY (`DeliveryId`),
        CONSTRAINT `FK_Deliveries_Orders_OrderId` FOREIGN KEY (`OrderId`) REFERENCES `Orders` (`OrderId`) ON DELETE RESTRICT,
        CONSTRAINT `FK_Deliveries_TrayRentals_RentalId` FOREIGN KEY (`RentalId`) REFERENCES `TrayRentals` (`RentalId`) ON DELETE SET NULL,
        CONSTRAINT `FK_Deliveries_Users_ShipperId` FOREIGN KEY (`ShipperId`) REFERENCES `Users` (`UserId`) ON DELETE SET NULL
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE TABLE `FarmZones` (
        `ZoneId` int NOT NULL AUTO_INCREMENT,
        `ZoneName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
        `LocationDescription` varchar(255) CHARACTER SET utf8mb4 NULL,
        `TotalCapacity` int NOT NULL,
        `IsActive` tinyint(1) NOT NULL,
        CONSTRAINT `PK_FarmZones` PRIMARY KEY (`ZoneId`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE TABLE `IoTDevices` (
        `DeviceId` int NOT NULL AUTO_INCREMENT,
        `DeviceCode` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
        `MacAddress` varchar(50) CHARACTER SET utf8mb4 NULL,
        `DeviceType` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `FirmwareVersion` varchar(50) CHARACTER SET utf8mb4 NULL,
        `Status` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `LastSeen` datetime(6) NULL,
        CONSTRAINT `PK_IoTDevices` PRIMARY KEY (`DeviceId`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE TABLE `Notifications` (
        `NotificationId` int NOT NULL AUTO_INCREMENT,
        `UserId` int NOT NULL,
        `Title` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
        `Message` longtext CHARACTER SET utf8mb4 NOT NULL,
        `NotificationType` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `ReferenceId` int NULL,
        `IsRead` tinyint(1) NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        CONSTRAINT `PK_Notifications` PRIMARY KEY (`NotificationId`),
        CONSTRAINT `FK_Notifications_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`UserId`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE TABLE `Payments` (
        `PaymentId` int NOT NULL AUTO_INCREMENT,
        `OrderId` int NOT NULL,
        `PaymentMethod` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `TransactionCode` varchar(100) CHARACTER SET utf8mb4 NULL,
        `AmountPaid` decimal(12,2) NOT NULL,
        `PaymentStatus` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `SePayPayload` json NULL,
        `PaidAt` datetime(6) NULL,
        CONSTRAINT `PK_Payments` PRIMARY KEY (`PaymentId`),
        CONSTRAINT `FK_Payments_Orders_OrderId` FOREIGN KEY (`OrderId`) REFERENCES `Orders` (`OrderId`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE TABLE `Supplies` (
        `SupplyId` int NOT NULL AUTO_INCREMENT,
        `SupplyName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
        `SupplyType` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `Description` varchar(1000) CHARACTER SET utf8mb4 NULL,
        `HarvestDays` int NOT NULL,
        `ImageUrl` varchar(500) CHARACTER SET utf8mb4 NULL,
        `CostPrice` decimal(12,2) NOT NULL,
        `UnitPrice` decimal(12,2) NOT NULL,
        `RentalPrice` decimal(12,2) NOT NULL,
        `QuantityInStock` int NOT NULL,
        `Unit` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `MinStockLevel` int NOT NULL,
        `IsActive` tinyint(1) NOT NULL,
        CONSTRAINT `PK_Supplies` PRIMARY KEY (`SupplyId`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE TABLE `FarmRacks` (
        `RackId` int NOT NULL AUTO_INCREMENT,
        `ZoneId` int NOT NULL,
        `RackCode` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `TotalTiers` int NOT NULL,
        `MaxTraysPerTier` int NOT NULL,
        CONSTRAINT `PK_FarmRacks` PRIMARY KEY (`RackId`),
        CONSTRAINT `FK_FarmRacks_FarmZones_ZoneId` FOREIGN KEY (`ZoneId`) REFERENCES `FarmZones` (`ZoneId`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE TABLE `ActuatorLogs` (
        `LogId` bigint NOT NULL AUTO_INCREMENT,
        `DeviceId` int NOT NULL,
        `PinNumber` varchar(30) CHARACTER SET utf8mb4 NULL,
        `ActuatorType` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `Action` varchar(10) CHARACTER SET utf8mb4 NOT NULL,
        `TriggeredBy` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `CommandId` varchar(100) CHARACTER SET utf8mb4 NULL,
        `RequestedByUserId` int NULL,
        `RequestedAt` datetime(6) NOT NULL,
        `AcknowledgedAt` datetime(6) NULL,
        `Result` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `FailureReason` varchar(500) CHARACTER SET utf8mb4 NULL,
        CONSTRAINT `PK_ActuatorLogs` PRIMARY KEY (`LogId`),
        CONSTRAINT `FK_ActuatorLogs_IoTDevices_DeviceId` FOREIGN KEY (`DeviceId`) REFERENCES `IoTDevices` (`DeviceId`) ON DELETE CASCADE,
        CONSTRAINT `FK_ActuatorLogs_Users_RequestedByUserId` FOREIGN KEY (`RequestedByUserId`) REFERENCES `Users` (`UserId`) ON DELETE SET NULL
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE TABLE `CameraSnapshots` (
        `SnapshotId` bigint NOT NULL AUTO_INCREMENT,
        `DeviceId` int NOT NULL,
        `RentalId` int NOT NULL,
        `ImageUrl` varchar(1000) CHARACTER SET utf8mb4 NOT NULL,
        `TakenAt` datetime(6) NOT NULL,
        CONSTRAINT `PK_CameraSnapshots` PRIMARY KEY (`SnapshotId`),
        CONSTRAINT `FK_CameraSnapshots_IoTDevices_DeviceId` FOREIGN KEY (`DeviceId`) REFERENCES `IoTDevices` (`DeviceId`) ON DELETE CASCADE,
        CONSTRAINT `FK_CameraSnapshots_TrayRentals_RentalId` FOREIGN KEY (`RentalId`) REFERENCES `TrayRentals` (`RentalId`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE TABLE `SensorTelemetry` (
        `TelemetryId` bigint NOT NULL AUTO_INCREMENT,
        `DeviceId` int NOT NULL,
        `SoilTrayId` int NOT NULL,
        `Temperature` float NULL,
        `AirHumidity` float NULL,
        `SoilHumidity` float NULL,
        `LightIntensity` float NULL,
        `RecordedAt` datetime(6) NOT NULL,
        CONSTRAINT `PK_SensorTelemetry` PRIMARY KEY (`TelemetryId`),
        CONSTRAINT `FK_SensorTelemetry_IoTDevices_DeviceId` FOREIGN KEY (`DeviceId`) REFERENCES `IoTDevices` (`DeviceId`) ON DELETE CASCADE,
        CONSTRAINT `FK_SensorTelemetry_SoilTrays_SoilTrayId` FOREIGN KEY (`SoilTrayId`) REFERENCES `SoilTrays` (`SoilTrayId`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE TABLE `SystemAlerts` (
        `AlertId` int NOT NULL AUTO_INCREMENT,
        `DeviceId` int NOT NULL,
        `RentalId` int NULL,
        `AlertType` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `Severity` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `Message` longtext CHARACTER SET utf8mb4 NOT NULL,
        `IsResolved` tinyint(1) NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        CONSTRAINT `PK_SystemAlerts` PRIMARY KEY (`AlertId`),
        CONSTRAINT `FK_SystemAlerts_IoTDevices_DeviceId` FOREIGN KEY (`DeviceId`) REFERENCES `IoTDevices` (`DeviceId`) ON DELETE CASCADE,
        CONSTRAINT `FK_SystemAlerts_TrayRentals_RentalId` FOREIGN KEY (`RentalId`) REFERENCES `TrayRentals` (`RentalId`) ON DELETE SET NULL
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE TABLE `TrayDevices` (
        `TrayDeviceId` int NOT NULL AUTO_INCREMENT,
        `SoilTrayId` int NOT NULL,
        `DeviceId` int NOT NULL,
        `PinNumber` varchar(30) CHARACTER SET utf8mb4 NULL,
        `ComponentType` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `AssignedAt` datetime(6) NOT NULL,
        `IsActive` tinyint(1) NOT NULL,
        CONSTRAINT `PK_TrayDevices` PRIMARY KEY (`TrayDeviceId`),
        CONSTRAINT `FK_TrayDevices_IoTDevices_DeviceId` FOREIGN KEY (`DeviceId`) REFERENCES `IoTDevices` (`DeviceId`) ON DELETE CASCADE,
        CONSTRAINT `FK_TrayDevices_SoilTrays_SoilTrayId` FOREIGN KEY (`SoilTrayId`) REFERENCES `SoilTrays` (`SoilTrayId`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE TABLE `CareSchedules` (
        `ScheduleId` int NOT NULL AUTO_INCREMENT,
        `SupplyId` int NOT NULL,
        `DayIndex` int NOT NULL,
        `TaskName` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
        `TaskDescription` longtext CHARACTER SET utf8mb4 NULL,
        `TargetStage` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        CONSTRAINT `PK_CareSchedules` PRIMARY KEY (`ScheduleId`),
        CONSTRAINT `FK_CareSchedules_Supplies_SupplyId` FOREIGN KEY (`SupplyId`) REFERENCES `Supplies` (`SupplyId`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE TABLE `CropThresholds` (
        `ThresholdId` int NOT NULL AUTO_INCREMENT,
        `SupplyId` int NOT NULL,
        `Stage` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `MinSoilMoisture` float NOT NULL,
        `MaxSoilMoisture` float NOT NULL,
        `MinAirHumidity` float NOT NULL,
        `MaxAirHumidity` float NOT NULL,
        `MinTemperature` float NOT NULL,
        `MaxTemperature` float NOT NULL,
        `MinLightIntensity` float NOT NULL,
        `MaxLightIntensity` float NOT NULL,
        `LightHoursPerDay` int NOT NULL,
        CONSTRAINT `PK_CropThresholds` PRIMARY KEY (`ThresholdId`),
        CONSTRAINT `FK_CropThresholds_Supplies_SupplyId` FOREIGN KEY (`SupplyId`) REFERENCES `Supplies` (`SupplyId`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE INDEX `IX_TrayRentals_CustomerId` ON `TrayRentals` (`CustomerId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE INDEX `IX_SoilTrays_RackId` ON `SoilTrays` (`RackId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE INDEX `IX_ActuatorLogs_DeviceId` ON `ActuatorLogs` (`DeviceId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE INDEX `IX_ActuatorLogs_RequestedByUserId` ON `ActuatorLogs` (`RequestedByUserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE INDEX `IX_CameraSnapshots_DeviceId` ON `CameraSnapshots` (`DeviceId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE INDEX `IX_CameraSnapshots_RentalId` ON `CameraSnapshots` (`RentalId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE INDEX `IX_CareSchedules_SupplyId` ON `CareSchedules` (`SupplyId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE INDEX `IX_CropThresholds_SupplyId` ON `CropThresholds` (`SupplyId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE INDEX `IX_DailyTasks_AssignedUserId` ON `DailyTasks` (`AssignedUserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE INDEX `IX_DailyTasks_RentalId` ON `DailyTasks` (`RentalId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE INDEX `IX_Deliveries_OrderId` ON `Deliveries` (`OrderId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE INDEX `IX_Deliveries_RentalId` ON `Deliveries` (`RentalId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE INDEX `IX_Deliveries_ShipperId` ON `Deliveries` (`ShipperId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE UNIQUE INDEX `IX_FarmRacks_RackCode` ON `FarmRacks` (`RackCode`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE INDEX `IX_FarmRacks_ZoneId` ON `FarmRacks` (`ZoneId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE UNIQUE INDEX `IX_FarmZones_ZoneName` ON `FarmZones` (`ZoneName`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE UNIQUE INDEX `IX_IoTDevices_DeviceCode` ON `IoTDevices` (`DeviceCode`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE UNIQUE INDEX `IX_IoTDevices_MacAddress` ON `IoTDevices` (`MacAddress`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE INDEX `IX_Notifications_UserId` ON `Notifications` (`UserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE INDEX `IX_Payments_OrderId` ON `Payments` (`OrderId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE UNIQUE INDEX `IX_Payments_TransactionCode` ON `Payments` (`TransactionCode`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE INDEX `IX_SensorTelemetry_DeviceId` ON `SensorTelemetry` (`DeviceId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE INDEX `IX_SensorTelemetry_SoilTrayId` ON `SensorTelemetry` (`SoilTrayId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE INDEX `IX_SystemAlerts_DeviceId` ON `SystemAlerts` (`DeviceId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE INDEX `IX_SystemAlerts_RentalId` ON `SystemAlerts` (`RentalId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE INDEX `IX_TrayDevices_DeviceId` ON `TrayDevices` (`DeviceId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    CREATE UNIQUE INDEX `IX_TrayDevices_SoilTrayId_DeviceId_ComponentType` ON `TrayDevices` (`SoilTrayId`, `DeviceId`, `ComponentType`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `OrderItems` ADD CONSTRAINT `FK_OrderItems_Supplies_SupplyId` FOREIGN KEY (`SupplyId`) REFERENCES `Supplies` (`SupplyId`) ON DELETE CASCADE;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `Orders` ADD CONSTRAINT `FK_Orders_Users_CustomerId` FOREIGN KEY (`CustomerId`) REFERENCES `Users` (`UserId`) ON DELETE CASCADE;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `SoilTrays` ADD CONSTRAINT `FK_SoilTrays_FarmRacks_RackId` FOREIGN KEY (`RackId`) REFERENCES `FarmRacks` (`RackId`) ON DELETE CASCADE;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `TrayRentals` ADD CONSTRAINT `FK_TrayRentals_Supplies_SupplyId` FOREIGN KEY (`SupplyId`) REFERENCES `Supplies` (`SupplyId`) ON DELETE CASCADE;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    ALTER TABLE `TrayRentals` ADD CONSTRAINT `FK_TrayRentals_Users_CustomerId` FOREIGN KEY (`CustomerId`) REFERENCES `Users` (`UserId`) ON DELETE CASCADE;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260922031133_AlignModelsWithErd') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260922031133_AlignModelsWithErd', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923032215_AddPaymentDeliveryWorkflow') THEN

    ALTER TABLE `Payments` DROP FOREIGN KEY `FK_Payments_Orders_OrderId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923032215_AddPaymentDeliveryWorkflow') THEN

    ALTER TABLE `Deliveries` DROP FOREIGN KEY `FK_Deliveries_Orders_OrderId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923032215_AddPaymentDeliveryWorkflow') THEN

    ALTER TABLE `Payments` DROP INDEX `IX_Payments_OrderId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923032215_AddPaymentDeliveryWorkflow') THEN

    ALTER TABLE `Deliveries` DROP INDEX `IX_Deliveries_OrderId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923032215_AddPaymentDeliveryWorkflow') THEN

    ALTER TABLE `Payments` ADD `ExceptionType` varchar(30) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'NONE';

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923032215_AddPaymentDeliveryWorkflow') THEN

    ALTER TABLE `Payments` ADD `ReviewedAt` datetime(6) NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923032215_AddPaymentDeliveryWorkflow') THEN

    ALTER TABLE `Payments` ADD `ReviewedByUserId` int NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923032215_AddPaymentDeliveryWorkflow') THEN

    ALTER TABLE `Payments` ADD `StaffNote` varchar(1000) CHARACTER SET utf8mb4 NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923032215_AddPaymentDeliveryWorkflow') THEN

    CREATE TABLE `PaymentWebhookEvents` (
        `PaymentWebhookEventId` bigint NOT NULL AUTO_INCREMENT,
        `SePayTransactionId` bigint NOT NULL,
        `OrderId` int NULL,
        `PaymentId` int NULL,
        `PaymentCode` varchar(100) CHARACTER SET utf8mb4 NULL,
        `ReferenceCode` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
        `Gateway` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
        `AccountNumber` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
        `TransferAmount` decimal(12,2) NOT NULL,
        `TransactionAt` datetime(6) NOT NULL,
        `ExceptionType` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `RawPayload` json NOT NULL,
        `ReceivedAt` datetime(6) NOT NULL,
        `StaffNote` varchar(1000) CHARACTER SET utf8mb4 NULL,
        `ReviewedByUserId` int NULL,
        `ReviewedAt` datetime(6) NULL,
        CONSTRAINT `PK_PaymentWebhookEvents` PRIMARY KEY (`PaymentWebhookEventId`),
        CONSTRAINT `FK_PaymentWebhookEvents_Orders_OrderId` FOREIGN KEY (`OrderId`) REFERENCES `Orders` (`OrderId`) ON DELETE SET NULL,
        CONSTRAINT `FK_PaymentWebhookEvents_Payments_PaymentId` FOREIGN KEY (`PaymentId`) REFERENCES `Payments` (`PaymentId`) ON DELETE SET NULL,
        CONSTRAINT `FK_PaymentWebhookEvents_Users_ReviewedByUserId` FOREIGN KEY (`ReviewedByUserId`) REFERENCES `Users` (`UserId`) ON DELETE SET NULL
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923032215_AddPaymentDeliveryWorkflow') THEN

    CREATE UNIQUE INDEX `IX_Payments_OrderId` ON `Payments` (`OrderId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923032215_AddPaymentDeliveryWorkflow') THEN

    CREATE INDEX `IX_Payments_ReviewedByUserId` ON `Payments` (`ReviewedByUserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923032215_AddPaymentDeliveryWorkflow') THEN

    CREATE UNIQUE INDEX `IX_Deliveries_OrderId` ON `Deliveries` (`OrderId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923032215_AddPaymentDeliveryWorkflow') THEN

    CREATE INDEX `IX_PaymentWebhookEvents_OrderId` ON `PaymentWebhookEvents` (`OrderId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923032215_AddPaymentDeliveryWorkflow') THEN

    CREATE INDEX `IX_PaymentWebhookEvents_PaymentId` ON `PaymentWebhookEvents` (`PaymentId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923032215_AddPaymentDeliveryWorkflow') THEN

    CREATE INDEX `IX_PaymentWebhookEvents_ReviewedByUserId` ON `PaymentWebhookEvents` (`ReviewedByUserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923032215_AddPaymentDeliveryWorkflow') THEN

    CREATE UNIQUE INDEX `IX_PaymentWebhookEvents_SePayTransactionId` ON `PaymentWebhookEvents` (`SePayTransactionId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923032215_AddPaymentDeliveryWorkflow') THEN

    ALTER TABLE `Payments` ADD CONSTRAINT `FK_Payments_Users_ReviewedByUserId` FOREIGN KEY (`ReviewedByUserId`) REFERENCES `Users` (`UserId`) ON DELETE SET NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923032215_AddPaymentDeliveryWorkflow') THEN

    ALTER TABLE `Payments` ADD CONSTRAINT `FK_Payments_Orders_OrderId` FOREIGN KEY (`OrderId`) REFERENCES `Orders` (`OrderId`) ON DELETE CASCADE;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923032215_AddPaymentDeliveryWorkflow') THEN

    ALTER TABLE `Deliveries` ADD CONSTRAINT `FK_Deliveries_Orders_OrderId` FOREIGN KEY (`OrderId`) REFERENCES `Orders` (`OrderId`) ON DELETE CASCADE;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923032215_AddPaymentDeliveryWorkflow') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260923032215_AddPaymentDeliveryWorkflow', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923045641_AddNotificationWorkflow') THEN

    ALTER TABLE `Notifications` ADD `CreatedByUserId` int NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923045641_AddNotificationWorkflow') THEN

    ALTER TABLE `Notifications` ADD `IdempotencyKey` varchar(150) CHARACTER SET utf8mb4 NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923045641_AddNotificationWorkflow') THEN

    ALTER TABLE `Notifications` ADD `ScheduledAt` datetime(6) NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923045641_AddNotificationWorkflow') THEN

    ALTER TABLE `Notifications` ADD `SentAt` datetime(6) NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923045641_AddNotificationWorkflow') THEN

    ALTER TABLE `Notifications` ADD `Status` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'SENT';

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923045641_AddNotificationWorkflow') THEN

    CREATE TABLE `FirebaseDeviceTokens` (
        `FirebaseDeviceTokenId` int NOT NULL AUTO_INCREMENT,
        `UserId` int NOT NULL,
        `Token` varchar(512) CHARACTER SET utf8mb4 NOT NULL,
        `Platform` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `IsActive` tinyint(1) NOT NULL,
        `RegisteredAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NOT NULL,
        CONSTRAINT `PK_FirebaseDeviceTokens` PRIMARY KEY (`FirebaseDeviceTokenId`),
        CONSTRAINT `FK_FirebaseDeviceTokens_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`UserId`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923045641_AddNotificationWorkflow') THEN

    CREATE INDEX `IX_Notifications_CreatedByUserId` ON `Notifications` (`CreatedByUserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923045641_AddNotificationWorkflow') THEN

    CREATE UNIQUE INDEX `IX_Notifications_IdempotencyKey` ON `Notifications` (`IdempotencyKey`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923045641_AddNotificationWorkflow') THEN

    CREATE UNIQUE INDEX `IX_FirebaseDeviceTokens_Token` ON `FirebaseDeviceTokens` (`Token`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923045641_AddNotificationWorkflow') THEN

    CREATE INDEX `IX_FirebaseDeviceTokens_UserId` ON `FirebaseDeviceTokens` (`UserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923045641_AddNotificationWorkflow') THEN

    ALTER TABLE `Notifications` ADD CONSTRAINT `FK_Notifications_Users_CreatedByUserId` FOREIGN KEY (`CreatedByUserId`) REFERENCES `Users` (`UserId`) ON DELETE SET NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923045641_AddNotificationWorkflow') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260923045641_AddNotificationWorkflow', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923054938_AddInventoryMovements') THEN

    CREATE TABLE `MaterialMovements` (
        `MovementId` bigint NOT NULL AUTO_INCREMENT,
        `SupplyId` int NOT NULL,
        `MovementType` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `Quantity` int NOT NULL,
        `BalanceAfter` int NOT NULL,
        `Reason` varchar(500) CHARACTER SET utf8mb4 NOT NULL,
        `OrderId` int NULL,
        `CreatedByUserId` int NULL,
        `CreatedAt` datetime(6) NOT NULL,
        CONSTRAINT `PK_MaterialMovements` PRIMARY KEY (`MovementId`),
        CONSTRAINT `FK_MaterialMovements_Orders_OrderId` FOREIGN KEY (`OrderId`) REFERENCES `Orders` (`OrderId`),
        CONSTRAINT `FK_MaterialMovements_Supplies_SupplyId` FOREIGN KEY (`SupplyId`) REFERENCES `Supplies` (`SupplyId`) ON DELETE CASCADE,
        CONSTRAINT `FK_MaterialMovements_Users_CreatedByUserId` FOREIGN KEY (`CreatedByUserId`) REFERENCES `Users` (`UserId`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923054938_AddInventoryMovements') THEN

    CREATE INDEX `IX_MaterialMovements_CreatedByUserId` ON `MaterialMovements` (`CreatedByUserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923054938_AddInventoryMovements') THEN

    CREATE INDEX `IX_MaterialMovements_OrderId` ON `MaterialMovements` (`OrderId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923054938_AddInventoryMovements') THEN

    CREATE INDEX `IX_MaterialMovements_SupplyId` ON `MaterialMovements` (`SupplyId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923054938_AddInventoryMovements') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260923054938_AddInventoryMovements', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923094537_AddCustomerDeliverySchedule') THEN

    ALTER TABLE `Deliveries` ADD `ScheduledDeliveryAt` datetime(6) NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923094537_AddCustomerDeliverySchedule') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260923094537_AddCustomerDeliverySchedule', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923095745_AddNotificationTemplates') THEN

    CREATE TABLE `NotificationTemplates` (
        `NotificationTemplateId` int NOT NULL AUTO_INCREMENT,
        `TemplateKey` varchar(80) CHARACTER SET utf8mb4 NOT NULL,
        `TitleTemplate` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
        `MessageTemplate` varchar(2000) CHARACTER SET utf8mb4 NOT NULL,
        `NotificationType` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `IsActive` tinyint(1) NOT NULL,
        `UpdatedAt` datetime(6) NOT NULL,
        `UpdatedByUserId` int NULL,
        CONSTRAINT `PK_NotificationTemplates` PRIMARY KEY (`NotificationTemplateId`),
        CONSTRAINT `FK_NotificationTemplates_Users_UpdatedByUserId` FOREIGN KEY (`UpdatedByUserId`) REFERENCES `Users` (`UserId`) ON DELETE SET NULL
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923095745_AddNotificationTemplates') THEN

    CREATE UNIQUE INDEX `IX_NotificationTemplates_TemplateKey` ON `NotificationTemplates` (`TemplateKey`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923095745_AddNotificationTemplates') THEN

    CREATE INDEX `IX_NotificationTemplates_UpdatedByUserId` ON `NotificationTemplates` (`UpdatedByUserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923095745_AddNotificationTemplates') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260923095745_AddNotificationTemplates', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923100815_AddPricingRules') THEN

    CREATE TABLE `PricingRules` (
        `PricingRuleId` int NOT NULL AUTO_INCREMENT,
        `PricingType` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `SupplyId` int NULL,
        `Amount` decimal(12,2) NOT NULL,
        `Unit` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `EffectiveFrom` datetime(6) NOT NULL,
        `EffectiveTo` datetime(6) NULL,
        `IsActive` tinyint(1) NOT NULL,
        `Notes` varchar(500) CHARACTER SET utf8mb4 NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `CreatedByUserId` int NULL,
        CONSTRAINT `PK_PricingRules` PRIMARY KEY (`PricingRuleId`),
        CONSTRAINT `FK_PricingRules_Supplies_SupplyId` FOREIGN KEY (`SupplyId`) REFERENCES `Supplies` (`SupplyId`) ON DELETE RESTRICT,
        CONSTRAINT `FK_PricingRules_Users_CreatedByUserId` FOREIGN KEY (`CreatedByUserId`) REFERENCES `Users` (`UserId`) ON DELETE SET NULL
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923100815_AddPricingRules') THEN

    CREATE INDEX `IX_PricingRules_CreatedByUserId` ON `PricingRules` (`CreatedByUserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923100815_AddPricingRules') THEN

    CREATE INDEX `IX_PricingRules_SupplyId` ON `PricingRules` (`SupplyId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923100815_AddPricingRules') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260923100815_AddPricingRules', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923101659_AutomateInventoryMovementsAndAlerts') THEN

    ALTER TABLE `SystemAlerts` DROP FOREIGN KEY `FK_SystemAlerts_IoTDevices_DeviceId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923101659_AutomateInventoryMovementsAndAlerts') THEN

    CREATE UNIQUE INDEX `IX_MaterialMovements_OrderId_SupplyId_MovementType` ON `MaterialMovements` (`OrderId`, `SupplyId`, `MovementType`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923101659_AutomateInventoryMovementsAndAlerts') THEN

    ALTER TABLE `MaterialMovements` DROP INDEX `IX_MaterialMovements_OrderId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923101659_AutomateInventoryMovementsAndAlerts') THEN

    ALTER TABLE `SystemAlerts` MODIFY COLUMN `DeviceId` int NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923101659_AutomateInventoryMovementsAndAlerts') THEN

    ALTER TABLE `SystemAlerts` ADD `SupplyId` int NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923101659_AutomateInventoryMovementsAndAlerts') THEN

    CREATE INDEX `IX_SystemAlerts_SupplyId` ON `SystemAlerts` (`SupplyId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923101659_AutomateInventoryMovementsAndAlerts') THEN

    ALTER TABLE `SystemAlerts` ADD CONSTRAINT `FK_SystemAlerts_IoTDevices_DeviceId` FOREIGN KEY (`DeviceId`) REFERENCES `IoTDevices` (`DeviceId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923101659_AutomateInventoryMovementsAndAlerts') THEN

    ALTER TABLE `SystemAlerts` ADD CONSTRAINT `FK_SystemAlerts_Supplies_SupplyId` FOREIGN KEY (`SupplyId`) REFERENCES `Supplies` (`SupplyId`) ON DELETE SET NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260923101659_AutomateInventoryMovementsAndAlerts') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260923101659_AutomateInventoryMovementsAndAlerts', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260924034418_AddMqttTelemetryIngestion') THEN

    ALTER TABLE `SensorTelemetry` ADD `MessageId` varchar(120) CHARACTER SET utf8mb4 NOT NULL DEFAULT '';

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260924034418_AddMqttTelemetryIngestion') THEN

    ALTER TABLE `SensorTelemetry` ADD `WaterLevel` float NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260924034418_AddMqttTelemetryIngestion') THEN

    UPDATE SensorTelemetry SET MessageId = CONCAT('legacy-', TelemetryId) WHERE MessageId = '';

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260924034418_AddMqttTelemetryIngestion') THEN

    CREATE UNIQUE INDEX `IX_SensorTelemetry_MessageId` ON `SensorTelemetry` (`MessageId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260924034418_AddMqttTelemetryIngestion') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260924034418_AddMqttTelemetryIngestion', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260926114406_AddCart') THEN

    CREATE TABLE `Carts` (
        `CartId` int NOT NULL AUTO_INCREMENT,
        `CustomerId` int NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NOT NULL,
        CONSTRAINT `PK_Carts` PRIMARY KEY (`CartId`),
        CONSTRAINT `FK_Carts_Users_CustomerId` FOREIGN KEY (`CustomerId`) REFERENCES `Users` (`UserId`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260926114406_AddCart') THEN

    CREATE TABLE `CartItems` (
        `CartItemId` int NOT NULL AUTO_INCREMENT,
        `CartId` int NOT NULL,
        `SeedVarietyId` int NOT NULL,
        `FarmAreaId` int NULL,
        `AddedAt` datetime(6) NOT NULL,
        CONSTRAINT `PK_CartItems` PRIMARY KEY (`CartItemId`),
        CONSTRAINT `FK_CartItems_Carts_CartId` FOREIGN KEY (`CartId`) REFERENCES `Carts` (`CartId`) ON DELETE CASCADE,
        CONSTRAINT `FK_CartItems_FarmZones_FarmAreaId` FOREIGN KEY (`FarmAreaId`) REFERENCES `FarmZones` (`ZoneId`) ON DELETE SET NULL,
        CONSTRAINT `FK_CartItems_Supplies_SeedVarietyId` FOREIGN KEY (`SeedVarietyId`) REFERENCES `Supplies` (`SupplyId`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260926114406_AddCart') THEN

    CREATE INDEX `IX_CartItems_CartId` ON `CartItems` (`CartId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260926114406_AddCart') THEN

    CREATE INDEX `IX_CartItems_FarmAreaId` ON `CartItems` (`FarmAreaId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260926114406_AddCart') THEN

    CREATE INDEX `IX_CartItems_SeedVarietyId` ON `CartItems` (`SeedVarietyId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260926114406_AddCart') THEN

    CREATE UNIQUE INDEX `IX_Carts_CustomerId` ON `Carts` (`CustomerId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260926114406_AddCart') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260926114406_AddCart', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260929070155_AddUserUpdatedAt') THEN

    ALTER TABLE `Users` ADD `UpdatedAt` datetime(6) NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260929070155_AddUserUpdatedAt') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260929070155_AddUserUpdatedAt', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261001082533_AddActuatorStateToTelemetry') THEN

    ALTER TABLE `SensorTelemetry` ADD `FanState` tinyint(1) NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261001082533_AddActuatorStateToTelemetry') THEN

    ALTER TABLE `SensorTelemetry` ADD `LedState` tinyint(1) NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261001082533_AddActuatorStateToTelemetry') THEN

    ALTER TABLE `SensorTelemetry` ADD `PumpState` tinyint(1) NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261001082533_AddActuatorStateToTelemetry') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20261001082533_AddActuatorStateToTelemetry', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012101316_AddFarmConfigReviewsAndCycles') THEN

    ALTER TABLE `Supplies` ADD `ExpectedYield` varchar(100) CHARACTER SET utf8mb4 NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012101316_AddFarmConfigReviewsAndCycles') THEN

    ALTER TABLE `Supplies` ADD `RiskDescription` longtext CHARACTER SET utf8mb4 NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012101316_AddFarmConfigReviewsAndCycles') THEN

    ALTER TABLE `Orders` ADD `IsReviewed` tinyint(1) NOT NULL DEFAULT FALSE;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012101316_AddFarmConfigReviewsAndCycles') THEN

    ALTER TABLE `Orders` ADD `IsRiskAccepted` tinyint(1) NOT NULL DEFAULT FALSE;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012101316_AddFarmConfigReviewsAndCycles') THEN

    ALTER TABLE `Orders` ADD `TargetDeliveryDate` datetime(6) NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012101316_AddFarmConfigReviewsAndCycles') THEN

    ALTER TABLE `Orders` ADD `TargetPlantingDate` datetime(6) NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012101316_AddFarmConfigReviewsAndCycles') THEN

    ALTER TABLE `OrderItems` ADD `CurrentCycle` int NOT NULL DEFAULT 1;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012101316_AddFarmConfigReviewsAndCycles') THEN

    ALTER TABLE `OrderItems` ADD `TotalCycles` int NOT NULL DEFAULT 1;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012101316_AddFarmConfigReviewsAndCycles') THEN

    ALTER TABLE `CropThresholds` MODIFY COLUMN `MinSoilMoisture` float NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012101316_AddFarmConfigReviewsAndCycles') THEN

    ALTER TABLE `CropThresholds` MODIFY COLUMN `MaxSoilMoisture` float NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012101316_AddFarmConfigReviewsAndCycles') THEN

    CREATE TABLE `FarmConfigs` (
        `ConfigId` int NOT NULL AUTO_INCREMENT,
        `FarmName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
        `MaxPreOrderDays` int NOT NULL,
        `StandardTraySize` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `MaxDeliveryRadiusKm` float NOT NULL,
        `DiscountCycleThreshold` int NOT NULL,
        `DiscountTrayThreshold` int NOT NULL,
        `LoyalOrderThreshold` int NOT NULL,
        `StandardDiscountPercent` decimal(5,2) NOT NULL,
        `LoyalDiscountPercent` decimal(5,2) NOT NULL,
        `BankAccountNumber` varchar(50) CHARACTER SET utf8mb4 NULL,
        `BankName` varchar(100) CHARACTER SET utf8mb4 NULL,
        `BankOwnerName` varchar(100) CHARACTER SET utf8mb4 NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_FarmConfigs` PRIMARY KEY (`ConfigId`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012101316_AddFarmConfigReviewsAndCycles') THEN

    CREATE TABLE `Reviews` (
        `ReviewId` int NOT NULL AUTO_INCREMENT,
        `OrderId` int NOT NULL,
        `CustomerId` int NOT NULL,
        `Rating` int NOT NULL,
        `Comment` longtext CHARACTER SET utf8mb4 NULL,
        `CreatedAt` datetime(6) NOT NULL,
        CONSTRAINT `PK_Reviews` PRIMARY KEY (`ReviewId`),
        CONSTRAINT `CK_Review_Rating` CHECK (`Rating` BETWEEN 1 AND 5),
        CONSTRAINT `FK_Reviews_Orders_OrderId` FOREIGN KEY (`OrderId`) REFERENCES `Orders` (`OrderId`) ON DELETE CASCADE,
        CONSTRAINT `FK_Reviews_Users_CustomerId` FOREIGN KEY (`CustomerId`) REFERENCES `Users` (`UserId`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012101316_AddFarmConfigReviewsAndCycles') THEN

    CREATE INDEX `IX_Reviews_CustomerId` ON `Reviews` (`CustomerId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012101316_AddFarmConfigReviewsAndCycles') THEN

    CREATE UNIQUE INDEX `IX_Reviews_OrderId` ON `Reviews` (`OrderId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012101316_AddFarmConfigReviewsAndCycles') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20261012101316_AddFarmConfigReviewsAndCycles', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012105322_AddCartItemTotalCycles') THEN

    ALTER TABLE `CartItems` ADD `TotalCycles` int NOT NULL DEFAULT 1;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012105322_AddCartItemTotalCycles') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20261012105322_AddCartItemTotalCycles', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012115607_AddTrayRentalCycles') THEN

    ALTER TABLE `TrayRentals` ADD `CurrentCycle` int NOT NULL DEFAULT 1;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012115607_AddTrayRentalCycles') THEN

    ALTER TABLE `TrayRentals` ADD `TotalCycles` int NOT NULL DEFAULT 1;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012115607_AddTrayRentalCycles') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20261012115607_AddTrayRentalCycles', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012122409_AddDeliveryCycleNumber') THEN

    ALTER TABLE `Deliveries` ADD `CycleNumber` int NOT NULL DEFAULT 1;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012122409_AddDeliveryCycleNumber') THEN

    CREATE UNIQUE INDEX `IX_Deliveries_OrderId_CycleNumber` ON `Deliveries` (`OrderId`, `CycleNumber`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012122409_AddDeliveryCycleNumber') THEN

    ALTER TABLE `Deliveries` DROP INDEX `IX_Deliveries_OrderId`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261012122409_AddDeliveryCycleNumber') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20261012122409_AddDeliveryCycleNumber', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261013004109_AddCartItemTargetPlantingDate') THEN

    ALTER TABLE `CartItems` ADD `TargetPlantingDate` datetime(6) NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261013004109_AddCartItemTargetPlantingDate') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20261013004109_AddCartItemTargetPlantingDate', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261014005920_AddOrderPricingSnapshot') THEN

    ALTER TABLE `Orders` ADD `CareFeeTotal` decimal(12,2) NOT NULL DEFAULT 0.0;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261014005920_AddOrderPricingSnapshot') THEN

    ALTER TABLE `Orders` ADD `DeliveryFee` decimal(12,2) NOT NULL DEFAULT 0.0;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261014005920_AddOrderPricingSnapshot') THEN

    ALTER TABLE `Orders` ADD `DiscountAmount` decimal(12,2) NOT NULL DEFAULT 0.0;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261014005920_AddOrderPricingSnapshot') THEN

    ALTER TABLE `Orders` ADD `DiscountPercent` decimal(5,2) NOT NULL DEFAULT 0.0;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261014005920_AddOrderPricingSnapshot') THEN

    ALTER TABLE `Orders` ADD `Subtotal` decimal(12,2) NOT NULL DEFAULT 0.0;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261014005920_AddOrderPricingSnapshot') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20261014005920_AddOrderPricingSnapshot', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261020045120_RemovePricingRulesAndFees') THEN

    DROP TABLE `PricingRules`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261020045120_RemovePricingRulesAndFees') THEN

    ALTER TABLE `Orders` DROP COLUMN `CareFeeTotal`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261020045120_RemovePricingRulesAndFees') THEN

    ALTER TABLE `Orders` DROP COLUMN `DeliveryFee`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261020045120_RemovePricingRulesAndFees') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20261020045120_RemovePricingRulesAndFees', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261023042031_AddOrderGeoDistanceAndFarmCoordinates') THEN

    ALTER TABLE `Orders` ADD `DeliveryDistanceKm` double NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261023042031_AddOrderGeoDistanceAndFarmCoordinates') THEN

    ALTER TABLE `Orders` ADD `ShippingLatitude` double NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261023042031_AddOrderGeoDistanceAndFarmCoordinates') THEN

    ALTER TABLE `Orders` ADD `ShippingLongitude` double NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261023042031_AddOrderGeoDistanceAndFarmCoordinates') THEN

    ALTER TABLE `FarmConfigs` ADD `FarmLatitude` double NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261023042031_AddOrderGeoDistanceAndFarmCoordinates') THEN

    ALTER TABLE `FarmConfigs` ADD `FarmLongitude` double NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261023042031_AddOrderGeoDistanceAndFarmCoordinates') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20261023042031_AddOrderGeoDistanceAndFarmCoordinates', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261023042355_RemoveWaterLevelFromTelemetry') THEN

    ALTER TABLE `SensorTelemetry` DROP COLUMN `WaterLevel`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261023042355_RemoveWaterLevelFromTelemetry') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20261023042355_RemoveWaterLevelFromTelemetry', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261023043748_AddShippingFeeAndPricingConfig') THEN

    ALTER TABLE `Orders` ADD `ShippingFee` decimal(12,2) NOT NULL DEFAULT 0.0;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261023043748_AddShippingFeeAndPricingConfig') THEN

    ALTER TABLE `FarmConfigs` ADD `BaseShippingFee` decimal(12,2) NOT NULL DEFAULT 0.0;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261023043748_AddShippingFeeAndPricingConfig') THEN

    ALTER TABLE `FarmConfigs` ADD `ShippingFeePerKm` decimal(12,2) NOT NULL DEFAULT 0.0;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261023043748_AddShippingFeeAndPricingConfig') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20261023043748_AddShippingFeeAndPricingConfig', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261023052501_AddOrderIsAccepted') THEN

    ALTER TABLE `Orders` ADD `IsAccepted` tinyint(1) NOT NULL DEFAULT FALSE;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261023052501_AddOrderIsAccepted') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20261023052501_AddOrderIsAccepted', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261023053643_RemoveShippingFeeColumns') THEN

    ALTER TABLE `Orders` DROP COLUMN `ShippingFee`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261023053643_RemoveShippingFeeColumns') THEN

    ALTER TABLE `FarmConfigs` DROP COLUMN `BaseShippingFee`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261023053643_RemoveShippingFeeColumns') THEN

    ALTER TABLE `FarmConfigs` DROP COLUMN `ShippingFeePerKm`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261023053643_RemoveShippingFeeColumns') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20261023053643_RemoveShippingFeeColumns', '8.0.2');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

DROP PROCEDURE `POMELO_BEFORE_DROP_PRIMARY_KEY`;

