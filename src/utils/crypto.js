// --- Funciones de Encriptación ---
export const getCryptoKey = async (uid) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(uid);
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    return window.crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
};

export const encryptText = async (text, uid) => {
    if (!text) return '';
    try {
        const key = await getCryptoKey(uid);
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedData = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
        const buffer = new Uint8Array(iv.length + encryptedData.byteLength);
        buffer.set(iv, 0);
        buffer.set(new Uint8Array(encryptedData), iv.length);
        return btoa(String.fromCharCode.apply(null, buffer));
    } catch (error) {
        console.error("Encryption failed:", error);
        return text;
    }
};

export const decryptText = async (encryptedBase64, uid) => {
    if (!encryptedBase64) return '';
    try {
        const key = await getCryptoKey(uid);
        const buffer = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
        const iv = buffer.slice(0, 12);
        const data = buffer.slice(12);
        const decryptedData = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
        const decoder = new TextDecoder();
        return decoder.decode(decryptedData);
    } catch (error) {
        console.error("Decryption failed:", error);
        return encryptedBase64;
    }
}; 