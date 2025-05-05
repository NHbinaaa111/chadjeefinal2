import { TestRecord } from '@/hooks/use-jee-recommendations';

// Service for managing test records in local storage
class TestRecordService {
  private readonly STORAGE_KEY = 'jee-test-records';

  // Fetch all test records for a user
  fetchTestRecords(userId: number | string): TestRecord[] {
    if (!userId) return [];
    
    try {
      const storageKey = `${this.STORAGE_KEY}-${userId}`;
      const records = localStorage.getItem(storageKey);
      return records ? JSON.parse(records) : [];
    } catch (error) {
      console.error('Error fetching test records:', error);
      return [];
    }
  }

  // Save a new test record
  addTestRecord(userId: number | string, record: Omit<TestRecord, 'id'>): TestRecord {
    if (!userId) throw new Error('User ID is required');
    
    try {
      const storageKey = `${this.STORAGE_KEY}-${userId}`;
      const records = this.fetchTestRecords(userId);
      
      // Create a new record with an ID
      const newRecord: TestRecord = {
        ...record,
        id: Date.now().toString(),
      };
      
      // Add to existing records
      const updatedRecords = [...records, newRecord];
      
      // Save back to local storage
      localStorage.setItem(storageKey, JSON.stringify(updatedRecords));
      
      return newRecord;
    } catch (error) {
      console.error('Error adding test record:', error);
      throw error;
    }
  }

  // Update an existing test record
  updateTestRecord(userId: number | string, recordId: string, updates: Partial<TestRecord>): TestRecord {
    if (!userId) throw new Error('User ID is required');
    if (!recordId) throw new Error('Record ID is required');
    
    try {
      const storageKey = `${this.STORAGE_KEY}-${userId}`;
      const records = this.fetchTestRecords(userId);
      
      // Find the record to update
      const recordIndex = records.findIndex(r => r.id === recordId);
      if (recordIndex === -1) throw new Error(`Test record with ID ${recordId} not found`);
      
      // Update the record
      const updatedRecord = { ...records[recordIndex], ...updates };
      records[recordIndex] = updatedRecord;
      
      // Save back to local storage
      localStorage.setItem(storageKey, JSON.stringify(records));
      
      return updatedRecord;
    } catch (error) {
      console.error('Error updating test record:', error);
      throw error;
    }
  }

  // Delete a test record
  deleteTestRecord(userId: number | string, recordId: string): boolean {
    if (!userId) throw new Error('User ID is required');
    if (!recordId) throw new Error('Record ID is required');
    
    try {
      const storageKey = `${this.STORAGE_KEY}-${userId}`;
      const records = this.fetchTestRecords(userId);
      
      // Filter out the record to delete
      const updatedRecords = records.filter(r => r.id !== recordId);
      
      // Save back to local storage
      localStorage.setItem(storageKey, JSON.stringify(updatedRecords));
      
      return true;
    } catch (error) {
      console.error('Error deleting test record:', error);
      return false;
    }
  }
}

export const testRecordService = new TestRecordService();
