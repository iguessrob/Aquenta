-- TEST_Delete_Reorder.sql
-- Manual test script to validate SP_DeleteConcessioner resequencing behavior.
-- Run inside a safe/dev copy of the database.

BEGIN TRANSACTION;

-- Adjust these IDs as appropriate for your test environment
DECLARE @TestDistrictID INT = 1;

-- Capture current state
SELECT ConcessionerID, DistrictID, AccountOrder, IsDeleted
FROM tbl_Concessioner
WHERE DistrictID = @TestDistrictID
ORDER BY AccountOrder;

-- Choose a concessioner in the middle to delete (replace with a real ID)
DECLARE @ToDeleteID INT;
SELECT TOP 1 @ToDeleteID = ConcessionerID
FROM tbl_Concessioner
WHERE DistrictID = @TestDistrictID AND IsDeleted = 0 AND AccountOrder = 2; -- pick order 2

PRINT 'Deleting concessioner ID:' + ISNULL(CONVERT(VARCHAR(10), @ToDeleteID), 'NULL');

-- Call the stored procedure
EXEC SP_DeleteConcessioner @ConcessionerID = @ToDeleteID;

-- View post-delete ordering
SELECT ConcessionerID, DistrictID, AccountOrder, IsDeleted
FROM tbl_Concessioner
WHERE DistrictID = @TestDistrictID
ORDER BY AccountOrder;

-- If results look correct, COMMIT; otherwise ROLLBACK.
-- COMMIT TRANSACTION;
-- ROLLBACK TRANSACTION; -- use this if you want to revert

-- Note: this script assumes `SP_DeleteConcessioner` is the procedure under test.
-- Replace @TestDistrictID and selection logic with valid values for your environment.
