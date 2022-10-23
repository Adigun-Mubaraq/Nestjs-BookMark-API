import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3333');
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'mubaraq@gmail.com',
      password: '123',
    };
    describe('Signup', () => {
      it('should sigin successfully', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });
    describe('Signin', () => {
      it('should signup successfully', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAccessToken', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get user profile', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAccessToken}',
          })
          .expectStatus(200);
      });
    });

    describe('Edit user profile', () => {
      const dto: EditUserDto = {
        firstName: "Mubaraq",
        email: "mubaraqmuby@gmail.com"
      }
      it('should edit user profile', () => {
        return pactum.spec().patch('/users').withHeaders({
          Authorization: 'Bearer $S{userAccessToken}',
        }).withBody(dto).expectStatus(200);
      })
    });
  });

  describe('Bookmarks', () => {
    describe('Should create a bookmark', () => {});
    describe('Should get all bookmarks', () => {});
    describe('Should get a bookmark', () => {});
    describe('Should edit a bookmark', () => {});
    describe('Should delete a bookmark', () => {});
  });
});
