import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from '../src/bookmark/dto';

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
        return pactum.spec().post('/auth/signup').withBody(dto).expectStatus(201);
      });
    });

    describe('Signin', () => {
      it('should signup successfully', () => {
        return pactum.spec().post('/auth/signin').withBody(dto).expectStatus(200).stores('userAccessToken', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get user profile', () => {
      it('should get current user', () => {
        return pactum.spec().get('/users/me').withHeaders({
            Authorization: 'Bearer $S{userAccessToken}',
          }).expectStatus(200);
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
    describe('Get empty bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum.spec().get('/bookmarks').withHeaders({
            Authorization: 'Bearer $S{userAccessToken}',
          }).expectStatus(200).expectBody([]);
      });
    });

    describe('Should create a bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'First Bookmark',
        link: 'https://www.youtube.com/watch?v=d6WC5n9G_sM',
      };
      it('should create bookmark', () => {
        return pactum.spec().post('/bookmarks').withHeaders({
            Authorization: 'Bearer $S{userAccessToken}',
          }).withBody(dto).expectStatus(201).stores('bookmarkId', 'id');
      });
    });

    describe('Should get all bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum.spec().get('/bookmarks').withHeaders({
            Authorization: 'Bearer $S{userAccessToken}',
          }).expectStatus(200).expectJsonLength(1);
      });
    });

    describe('Should get a bookmark', () => {
      it('should get bookmark by id', () => {
        return pactum.spec().get('/bookmarks/{id}').withPathParams('id', '$S{bookmarkId}').withHeaders({
            Authorization: 'Bearer $S{userAccessToken}',
          }).expectStatus(200).expectBodyContains('$S{bookmarkId}');
      });
    });

    describe('Should edit a bookmark', () => {
      const dto: EditBookmarkDto = {
        title:
          'Kubernetes Course - Full Beginners Tutorial (Containerize Your Apps!)',
        description:
          'Learn how to use Kubernetes in this complete course. Kubernetes makes it possible to containerize applications and simplifies app deployment to production.',
      };
      it('should edit bookmark', () => {
        return pactum.spec().patch('/bookmarks/{id}').withPathParams('id', '$S{bookmarkId}').withHeaders({
            Authorization: 'Bearer $S{userAccessToken}',
          }).withBody(dto).expectStatus(200).expectBodyContains(dto.title).expectBodyContains(dto.description);
      });
    });

    describe('Should delete a bookmark', () => {
      it('should delete bookmark', () => {
        return pactum.spec().delete('/bookmarks/{id}').withPathParams('id', '$S{bookmarkId}').withHeaders({
            Authorization: 'Bearer $S{userAccessToken}',
          }).expectStatus(204);
      });

      it('should get empty bookmarks', () => {
        return pactum.spec().get('/bookmarks').withHeaders({
            Authorization: 'Bearer $S{userAccessToken}',
          }).expectStatus(200).expectJsonLength(0);
      });
    });
  });
});
