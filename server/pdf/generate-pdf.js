import pdf from 'html-pdf';
import fs from 'fs';
let mod;

const getBase64String = (path) => {
  try {
    const file = fs.readFileSync(path);
    return new Buffer(file).toString('base64');
  } catch (exception) {
    return null;
  }
};

const generatePDF = (html, fileName) => {
  try {
    pdf.create(html, { border: '0' }).toFile(`./${fileName}`, (error, response) => {
      if (error) {
        mod.reject(error);
      } else {
        mod.resolve({ fileName, base64: getBase64String(response.filename) });
        fs.unlink(response.filename);
      }
    });
  } catch (exception) {
    mod.reject(exception);
  }
};

const handler = (html, fileName, promise) => {
  mod = promise;
  if (html && fileName) generatePDF(html, fileName);
};

export const generateComponentAsPDF = (html, fileName) => {
  return new Promise((resolve, reject) => {
    return handler(html, fileName, { resolve, reject });
  });
};
