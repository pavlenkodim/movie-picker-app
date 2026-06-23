import { BadRequestException } from "@nestjs/common";
import { extname } from "path";
import { FILE_VALIDATION } from "../constants";
import MulterFile from "src/s3/types/multer-file.type";

export function validateProfileThumbnail(file: MulterFile): void {
  const extension = extname(file.originalname).toLowerCase();

  if (!FILE_VALIDATION.ALLOWED_EXTENSIONS.includes(extension)) {
    throw new BadRequestException(
      `Invalid file extension. Allowed: ${FILE_VALIDATION.ALLOWED_EXTENSIONS.join(", ")}`,
    );
  }

  if (!FILE_VALIDATION.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new BadRequestException("Invalid file type");
  }

  if (file.size > FILE_VALIDATION.MAX_FILE_SIZE) {
    throw new BadRequestException(
      `File size exceeds maximum allowed (${FILE_VALIDATION.MAX_FILE_SIZE / 1024 / 1024}MB)`,
    );
  }
}
