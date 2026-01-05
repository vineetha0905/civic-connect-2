import AsyncStorage from '@react-native-async-storage/async-storage';

const StorageKeys = {
  USER: 'civicconnect_user',
  TOKEN: 'civicconnect_token',
  ADMIN: 'civicconnect_admin',
  LANGUAGE: 'civicconnect_language',
};

export const storage = {
  async getItem(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  },

  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  },

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  },

  async clear() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};

export const getUser = () => storage.getItem(StorageKeys.USER);
export const setUser = (user) => storage.setItem(StorageKeys.USER, user);
export const removeUser = () => storage.removeItem(StorageKeys.USER);

export const getToken = () => storage.getItem(StorageKeys.TOKEN);
export const setToken = (token) => storage.setItem(StorageKeys.TOKEN, token);
export const removeToken = () => storage.removeItem(StorageKeys.TOKEN);

export const getAdmin = () => storage.getItem(StorageKeys.ADMIN);
export const setAdmin = (admin) => storage.setItem(StorageKeys.ADMIN, admin);
export const removeAdmin = () => storage.removeItem(StorageKeys.ADMIN);

export const getLanguage = () => storage.getItem(StorageKeys.LANGUAGE);
export const setLanguage = (lang) => storage.setItem(StorageKeys.LANGUAGE, lang);

export default storage;

