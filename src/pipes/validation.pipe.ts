import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ValidationException } from "src/exeptions/validation.exeption";

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    if (!metadata.metatype) return value;

    const obj = plainToInstance(metadata.metatype, value);
    const error = await validate(obj);

    if (error.length) {
      let messages = error.map((err) => {
        return `${err.property} - ${err.constraints ? Object.values(err.constraints).join(", ") : "Unknown error"}`;
      });
      throw new ValidationException(messages);
    }

    return value;
  }
}
