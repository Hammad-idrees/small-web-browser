import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PeopleController } from './people.controller.js';
import { Person, PersonSchema } from './schemas/person.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Person.name, schema: PersonSchema }]),
  ],
  controllers: [PeopleController],
  exports: [MongooseModule],
})
export class PeopleModule {}
