import { Controller, Get } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Person as PersonDto } from '@small-web/contracts';
import type { Model } from 'mongoose';
import { Person } from './schemas/person.schema.js';

@Controller('api/people')
export class PeopleController {
  constructor(
    @InjectModel(Person.name) private readonly people: Model<Person>,
  ) {}

  @Get()
  async list(): Promise<PersonDto[]> {
    const people = await this.people.find().sort({ name: 1 }).lean();
    return people.map((person) => ({
      id: person._id.toHexString(),
      name: person.name,
    }));
  }
}
