import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Créer un utilisateur par défaut s'il n'existe pas
  const defaultUser = await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      email: 'utilisateur@exemple.com',
      name: 'Utilisateur par défaut',
    },
  });

  console.log('Utilisateur par défaut créé:', defaultUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
