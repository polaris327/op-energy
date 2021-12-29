START TRANSACTION;

delimiter //

DROP PROCEDURE IF EXISTS create_table_chainstats;
CREATE PROCEDURE create_table_chainstats()
begin
  SET @revision := (select revision from version limit 1);
  if @revision = 1 then
    DROP TABLE IF EXISTS `chainstats`;
    CREATE TABLE `chainstats` (
      `block_height` int(11) NOT NULL,
      `chain_revenue` double,
      `chain_fee` double,
      `chain_subsidy` double,
      `chainwork` VARCHAR(65),
      PRIMARY KEY(block_height)
    ) ENGINE=InnoDB CHARSET=utf8;
    update `version` set revision=2 where revision=1;
  end if;
end;
//

delimiter ;

call create_table_chainstats();
drop procedure  create_table_chainstats;
COMMIT;
