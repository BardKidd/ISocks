import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPortfolioSystem1757744122346 implements MigrationInterface {
    name = 'AddPortfolioSystem1757744122346'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`transactions\` (\`id\` varchar(36) NOT NULL, \`positionId\` varchar(255) NOT NULL, \`type\` enum ('BUY', 'SELL') NOT NULL, \`quantity\` decimal(20,5) NOT NULL, \`price\` decimal(10,4) NOT NULL, \`amount\` decimal(15,2) NOT NULL, \`commission\` decimal(8,2) NOT NULL DEFAULT '0.00', \`tax\` decimal(8,2) NOT NULL DEFAULT '0.00', \`otherFees\` decimal(8,2) NOT NULL DEFAULT '0.00', \`totalCost\` decimal(15,2) NOT NULL, \`tradeDate\` date NOT NULL, \`notes\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`positions\` (\`id\` varchar(36) NOT NULL, \`symbol\` varchar(20) NOT NULL, \`stockName\` varchar(200) NOT NULL, \`market\` varchar(50) NOT NULL DEFAULT 'US', \`portfolioId\` varchar(255) NOT NULL, \`quantity\` decimal(20,5) NOT NULL, \`averageCost\` decimal(10,4) NOT NULL, \`totalCost\` decimal(15,2) NOT NULL, \`fees\` decimal(15,2) NOT NULL DEFAULT '0.00', \`currentPrice\` decimal(10,4) NOT NULL DEFAULT '0.0000', \`currentValue\` decimal(15,2) NOT NULL DEFAULT '0.00', \`unrealizedReturn\` decimal(15,2) NOT NULL DEFAULT '0.00', \`returnPercentage\` decimal(5,2) NOT NULL DEFAULT '0.00', \`dayChange\` decimal(10,4) NOT NULL DEFAULT '0.0000', \`dayChangePercent\` decimal(5,2) NOT NULL DEFAULT '0.00', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`priceUpdatedAt\` datetime NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`portfolios\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`description\` text NULL, \`userId\` varchar(255) NOT NULL, \`totalValue\` decimal(15,2) NOT NULL DEFAULT '0.00', \`totalCost\` decimal(15,2) NOT NULL DEFAULT '0.00', \`totalReturn\` decimal(15,2) NOT NULL DEFAULT '0.00', \`returnPercentage\` decimal(5,2) NOT NULL DEFAULT '0.00', \`dayChange\` decimal(5,2) NOT NULL DEFAULT '0.00', \`dayChangeAmount\` decimal(15,2) NOT NULL DEFAULT '0.00', \`currency\` varchar(255) NOT NULL DEFAULT 'USD', \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`firstName\` varchar(50) NULL, \`lastName\` varchar(50) NULL, \`dateOfBirth\` date NULL, \`phone\` varchar(20) NULL, \`riskTolerance\` enum ('conservative', 'moderate', 'aggressive') NOT NULL DEFAULT 'moderate', \`preferredCurrency\` varchar(3) NOT NULL DEFAULT 'USD', \`totalPortfolioValue\` decimal(15,2) NOT NULL DEFAULT '0.00', \`totalInvestment\` decimal(15,2) NOT NULL DEFAULT '0.00', \`totalReturn\` decimal(15,2) NOT NULL DEFAULT '0.00', \`returnPercentage\` decimal(5,2) NOT NULL DEFAULT '0.00', \`isActive\` tinyint NOT NULL DEFAULT 1, \`isEmailVerified\` tinyint NOT NULL DEFAULT 0, \`refreshToken\` varchar(255) NULL, UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_26d3ddc08f3ca2799c6b5ac4d30\` FOREIGN KEY (\`positionId\`) REFERENCES \`positions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`positions\` ADD CONSTRAINT \`FK_0d5f4889958502cbba1feb0f822\` FOREIGN KEY (\`portfolioId\`) REFERENCES \`portfolios\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`portfolios\` ADD CONSTRAINT \`FK_e4e66691a2634fcf5525e33ecf5\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`portfolios\` DROP FOREIGN KEY \`FK_e4e66691a2634fcf5525e33ecf5\``);
        await queryRunner.query(`ALTER TABLE \`positions\` DROP FOREIGN KEY \`FK_0d5f4889958502cbba1feb0f822\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_26d3ddc08f3ca2799c6b5ac4d30\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP TABLE \`portfolios\``);
        await queryRunner.query(`DROP TABLE \`positions\``);
        await queryRunner.query(`DROP TABLE \`transactions\``);
    }

}
