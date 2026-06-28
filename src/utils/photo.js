// Resolves a teacher photo value to a filename string.
// The backend returns the `photo` column as a Buffer in JSON
// (e.g. { type: 'Buffer', data: [...] }) instead of a plain string,
// so we decode that case back into the filename it represents.
export function resolvePhotoFilename(photo) {
    if (!photo) return null;
    if (typeof photo === 'string') return photo;
    if (photo.type === 'Buffer' && Array.isArray(photo.data)) {
        return String.fromCharCode(...photo.data);
    }
    return null;
}
