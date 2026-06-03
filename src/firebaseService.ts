/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Student, SchoolInfo, GalleryItem } from './data';

const STUDENTS_COLLECTION = 'students';
const SETTINGS_COLLECTION = 'settings';
const GALLERY_COLLECTION = 'gallery';

// 1. Fetch all students from Firestore
export async function getStudentsFromFirestore(): Promise<Student[]> {
  try {
    const querySnapshot = await getDocs(collection(db, STUDENTS_COLLECTION));
    const list: Student[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Student);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, STUDENTS_COLLECTION);
    return [];
  }
}

// 2. Save/Update individual student
export async function saveStudentToFirestore(student: Student): Promise<void> {
  const path = `${STUDENTS_COLLECTION}/${student.nisn}`;
  try {
    await setDoc(doc(db, STUDENTS_COLLECTION, student.nisn), student);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// 3. Batch save students
export async function saveStudentsBatchToFirestore(students: Student[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    students.forEach((student) => {
      const ref = doc(db, STUDENTS_COLLECTION, student.nisn);
      batch.set(ref, student);
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, STUDENTS_COLLECTION);
  }
}

// 4. Delete single student
export async function deleteStudentFromFirestore(nisn: string): Promise<void> {
  const path = `${STUDENTS_COLLECTION}/${nisn}`;
  try {
    await deleteDoc(doc(db, STUDENTS_COLLECTION, nisn));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// 5. Fetch School Settings
export async function getSchoolInfoFromFirestore(defaultInfo: SchoolInfo): Promise<SchoolInfo> {
  const docRef = doc(db, SETTINGS_COLLECTION, 'school_info');
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SchoolInfo;
    } else {
      // Seed with default
      await setDoc(docRef, defaultInfo);
      return defaultInfo;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${SETTINGS_COLLECTION}/school_info`);
    return defaultInfo;
  }
}

// 6. Save School Settings
export async function saveSchoolInfoToFirestore(info: SchoolInfo): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/school_info`;
  try {
    await setDoc(doc(db, SETTINGS_COLLECTION, 'school_info'), info);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// 7. Fetch Gallery documentation
export async function getGalleryFromFirestore(defaultGallery: GalleryItem[]): Promise<GalleryItem[]> {
  try {
    const querySnapshot = await getDocs(collection(db, GALLERY_COLLECTION));
    const list: GalleryItem[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(docSnap.data() as GalleryItem);
    });
    
    if (list.length === 0 && defaultGallery.length > 0) {
      // Seed initial gallery docs in a batch
      const batch = writeBatch(db);
      defaultGallery.forEach((item) => {
        const ref = doc(db, GALLERY_COLLECTION, item.id);
        batch.set(ref, item);
      });
      await batch.commit();
      return defaultGallery;
    }
    
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, GALLERY_COLLECTION);
    return defaultGallery;
  }
}

// 8. Save/Update individual Gallery item
export async function saveGalleryItemToFirestore(item: GalleryItem): Promise<void> {
  const path = `${GALLERY_COLLECTION}/${item.id}`;
  try {
    await setDoc(doc(db, GALLERY_COLLECTION, item.id), item);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// 9. Batch save gallery
export async function saveGalleryBatchToFirestore(items: GalleryItem[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      const ref = doc(db, GALLERY_COLLECTION, item.id);
      batch.set(ref, item);
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, GALLERY_COLLECTION);
  }
}
