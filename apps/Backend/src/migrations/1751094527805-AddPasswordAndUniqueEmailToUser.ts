import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordAndUniqueEmailToUser1751094527805
  implements MigrationInterface
{
  name = 'AddPasswordAndUniqueEmailToUser1751094527805';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`password\` varchar(255) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
