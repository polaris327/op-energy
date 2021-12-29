START TRANSACTION;

delimiter //

DROP PROCEDURE IF EXISTS create_table_version;
CREATE PROCEDURE create_table_version()
begin
  CREATE TABLE IF NOT EXISTS `version` (
    `revision` int(8) NOT NULL,
    PRIMARY KEY(revision)
  ) ENGINE=InnoDB CHARSET=utf8;
  SET @revision := (SELECT IF( EXISTS (select 1 from version limit 1), 1, 0));
  if @revision = 0 then
    INSERT INTO `version` (`revision`) VALUES (1);
  end if;
end;
//

delimiter ;

call create_table_version();
drop procedure  create_table_version;
COMMIT;
