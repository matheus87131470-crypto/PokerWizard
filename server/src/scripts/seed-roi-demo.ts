/**
 * Script para popular dados de demonstração de ROI
 * Uso: npm run seed-roi-demo <user_email>
 */

import { v4 as uuid } from 'uuid';
import {
  dbGetUserByEmail,
  dbCreateTournamentSession
} from '../services/database';

async function seedROIDemo(userEmail: string) {
  console.log(`\n🎯 Populando dados de ROI para ${userEmail}...`);

  try {
    // Buscar usuário
    const user = await dbGetUserByEmail(userEmail);
    if (!user) {
      console.error(`❌ Usuário ${userEmail} não encontrado!`);
      process.exit(1);
    }

    console.log(`✅ Usuário encontrado: ${user.name} (${user.id})`);

    // Criar 15 sessões de torneios de exemplo
    const sessions = [
      // MTT - Torneios grandes
      { tipo: 'MTT', buyin: 50, premio: 125, date: new Date('2026-01-05') },
      { tipo: 'MTT', buyin: 50, premio: 0, date: new Date('2026-01-05') },
      { tipo: 'MTT', buyin: 100, premio: 350, date: new Date('2026-01-04') },
      { tipo: 'MTT', buyin: 100, premio: 0, date: new Date('2026-01-04') },
      { tipo: 'MTT', buyin: 75, premio: 200, date: new Date('2026-01-03') },
      { tipo: 'MTT', buyin: 200, premio: 800, date: new Date('2026-01-02') },
      { tipo: 'MTT', buyin: 150, premio: 0, date: new Date('2026-01-01') },
      
      // SNG - Sit & Go
      { tipo: 'SNG', buyin: 20, premio: 45, date: new Date('2026-01-06') },
      { tipo: 'SNG', buyin: 20, premio: 0, date: new Date('2026-01-06') },
      { tipo: 'SNG', buyin: 30, premio: 70, date: new Date('2026-01-05') },
      { tipo: 'SNG', buyin: 30, premio: 0, date: new Date('2026-01-04') },
      { tipo: 'SNG', buyin: 50, premio: 150, date: new Date('2026-01-03') },
      { tipo: 'SNG', buyin: 25, premio: 50, date: new Date('2026-01-02') },
      { tipo: 'SNG', buyin: 40, premio: 0, date: new Date('2026-01-01') },
      { tipo: 'SNG', buyin: 60, premio: 180, date: new Date('2025-12-30') }
    ];

    let totalBuyins = 0;
    let totalPremios = 0;

    for (const session of sessions) {
      await dbCreateTournamentSession({
        id: uuid(),
        userId: user.id,
        tipoJogo: session.tipo as 'MTT' | 'SNG',
        buyIn: session.buyin,
        premio: session.premio,
        data: session.date
      });

      totalBuyins += session.buyin;
      totalPremios += session.premio;
      
      console.log(`  ✓ ${session.tipo} - Buy-in: R$ ${session.buyin} / Prêmio: R$ ${session.premio}`);
    }

    const roi = ((totalPremios - totalBuyins) / totalBuyins) * 100;

    console.log(`\n📊 Resumo dos dados criados:`);
    console.log(`   Total de torneios: ${sessions.length}`);
    console.log(`   Buy-ins totais: R$ ${totalBuyins.toFixed(2)}`);
    console.log(`   Prêmios totais: R$ ${totalPremios.toFixed(2)}`);
    console.log(`   Lucro: R$ ${(totalPremios - totalBuyins).toFixed(2)}`);
    console.log(`   ROI: ${roi.toFixed(1)}%`);
    console.log(`\n✅ Dados de demonstração criados com sucesso!`);
    console.log(`\n🔄 Atualize a página do Histórico para ver os dados.`);

  } catch (error: any) {
    console.error('❌ Erro ao popular dados:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

// Executar
const userEmail = process.argv[2];
if (!userEmail) {
  console.error('❌ Uso: npm run seed-roi-demo <user_email>');
  console.error('   Exemplo: npm run seed-roi-demo usuario@exemplo.com');
  process.exit(1);
}

seedROIDemo(userEmail);
