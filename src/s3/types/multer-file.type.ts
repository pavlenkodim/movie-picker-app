export default interface MulterFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
