import JSZip from 'jszip';
import saveAs from 'file-saver';
import { FileSystemItem } from '../types';

export const exportProjectAsZip = async (projectName: string, files: FileSystemItem[]) => {
  const zip = new JSZip();

  files.forEach(item => {
    if (item.type === 'file') {
        // Simple flat structure for now, assuming relative paths in name are handled
        // If names are like "src/index.js", JSZip handles folders automatically
        zip.file(item.name, (item as any).content);
    }
  });

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${projectName.replace(/\s+/g, '-')}-lemonade-export.zip`);
};