export const auth = {
  onAuthStateChanged: jest.fn(),
  currentUser: null,
};
export const googleProvider = {};
export const signInWithEmailAndPassword = jest.fn();
export const signInWithPopup = jest.fn();
export const createUserWithEmailAndPassword = jest.fn();
export const getAuth = jest.fn(() => auth);