import { DataSource } from 'typeorm';
import { BaseFactory } from './base.factory';
import { getRepositoryByName } from '../utils/repository.utils';
import { EmployerAuth } from '@app/common/database/entities/EmployerAuth.entity';
import { EmployerProfile } from '@app/common/database/entities/EmployerProfile.entity';
import { EMPLOYERS_DATA } from '../data/employers.data';
import { DocumentFactory } from './document.factory';

export class EmployerFactory extends BaseFactory<EmployerAuth> {
  private profileRepository: any;
  private verificationRepository: any;
  private verificationDocumentRepository: any;
  private documentFactory: DocumentFactory;
  constructor(dataSource: DataSource) {
    super(dataSource, getRepositoryByName(dataSource, 'EmployerAuth'), {
      defaultAttributes: () => ({ emailVerified: true }),
    });
    this.profileRepository = getRepositoryByName(dataSource, 'EmployerProfile');
    this.verificationRepository = getRepositoryByName(
      dataSource,
      'EmployerVerification',
    );
    this.verificationDocumentRepository = getRepositoryByName(
      dataSource,
      'EmployerVerificationDocument',
    );
    this.documentFactory = new DocumentFactory(this.dataSource);
  }

  // createOrUpdateEmployer upserts auth, profile, verification, and documents
  async createOrUpdateEmployer(data: any): Promise<EmployerAuth> {
    const {
      passwordHash,
      firstName,
      lastName,
      phoneNumber,
      address,
      type,
      profilePictureId,
      verification,
      ...rest
    } = data;

    const auth = await this.smartUpsert(
      {
        id: data.id,
        email: data.email.toLowerCase(),
        password: passwordHash,
        emailVerified: true,
      } as any,
      ['id', 'email'],
    );

    const profileRepo = this.profileRepository as ReturnType<
      typeof getRepositoryByName
    >;

    const existingProfile = await profileRepo.findOne({
      where: { id: auth.id },
    });

    const profileData: Partial<EmployerProfile> = {
      id: auth.id,
      firstName,
      lastName,
      email: data.email.toLowerCase(),
      phoneNumber,
      address,
      type,
      profilePictureId,
    };

    if (existingProfile) {
      await profileRepo.update({ id: existingProfile.id }, profileData);
    } else {
      await profileRepo.save(profileRepo.create(profileData));
    }

    // Handle Verification
    if (verification) {
      const verificationRepo = this.verificationRepository;
      const verificationDocRepo = this.verificationDocumentRepository;

      let existingVerification = await verificationRepo.findOne({
        where: { employerId: auth.id },
      });

      const verificationData = {
        employerId: auth.id,
        companyName: verification.companyName,
        companyAddress: verification.companyAddress,
        status: verification.status,
      };

      if (existingVerification) {
        await verificationRepo.update(
          { id: existingVerification.id },
          verificationData,
        );
      } else {
        existingVerification = await verificationRepo.save(
          verificationRepo.create(verificationData),
        );
      }

      // Handle Verification Documents
      if (verification.documents && verification.documents.length > 0) {
        for (const doc of verification.documents) {
          const docData = {
            verificationId: existingVerification.id,
            documentId: doc.documentId,
            documentType: doc.documentType,
            verified: doc.verified,
          };

          const existingDoc = await verificationDocRepo.findOne({
            where: {
              verificationId: existingVerification.id,
              documentId: doc.documentId,
            },
          });

          if (!existingDoc) {
            await verificationDocRepo.save(verificationDocRepo.create(docData));
          }
        }
      }
    }

    return auth as any;
  }

  // createAll upserts all employer seed records
  async createAll(): Promise<EmployerAuth[]> {
    console.log('🔄 Upserting employer auth/profile records...');

    await this.documentFactory.createAll();

    const employers: EmployerAuth[] = [];
    for (const empData of EMPLOYERS_DATA) {
      try {
        const emp = await this.createOrUpdateEmployer(empData);
        employers.push(emp);
      } catch (error: any) {
        console.warn(
          `⚠️  Failed to upsert employer: ${empData.email}`,
          error.message,
        );
      }
    }

    console.log(`✅ Upserted ${employers.length} employer records`);
    return employers;
  }
}
