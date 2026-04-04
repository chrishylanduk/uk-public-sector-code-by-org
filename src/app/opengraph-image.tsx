import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import path from 'path';
import { fetchGithubRepos, fetchAllGovUkOrgs, fetchPlanningDataOrgs, fetchLgaFteData, fetchCsStatsFteData } from '@/lib/data-fetcher';
import { processOrganisationData, getOrgList } from '@/lib/data-processor';

export const dynamic = 'force-static';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage() {
  const [repos, govOrgs, planningOrgs, lgaFteData, csStatsFteData] = await Promise.all([
    fetchGithubRepos(), fetchAllGovUkOrgs(), fetchPlanningDataOrgs(), fetchLgaFteData(), fetchCsStatsFteData(),
  ]);
  const organisations = await processOrganisationData(repos, govOrgs, planningOrgs, lgaFteData, csStatsFteData);
  const orgList = getOrgList(organisations);
  const totalRepos = orgList.reduce((sum, e) => sum + e.repoCount, 0);

  const iconBuffer = readFileSync(path.join(process.cwd(), 'src/app/icon.png'));
  const iconSrc = `data:image/png;base64,${iconBuffer.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: '#9a3412',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '0 80px', textAlign: 'center' }}>
          { }
          <img src={iconSrc} width={80} height={80} alt="" style={{ borderRadius: '14px' }} />
          <div style={{ display: 'flex', color: 'white', fontSize: 56, fontWeight: 700, lineHeight: 1.15 }}>
            UK Public Sector Code by Organisation
          </div>
          <div style={{ display: 'flex', color: 'rgba(255,255,255,0.85)', fontSize: 26 }}>
            Explore the open source code published by every UK public sector organisation
          </div>
          <div style={{ display: 'flex', gap: '48px', marginTop: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', color: 'white', fontSize: 44, fontWeight: 700 }}>
                {orgList.length}
              </div>
              <div style={{ display: 'flex', color: 'rgba(255,255,255,0.75)', fontSize: 20 }}>organisations</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', color: 'white', fontSize: 44, fontWeight: 700 }}>
                {totalRepos.toLocaleString('en-GB')}
              </div>
              <div style={{ display: 'flex', color: 'rgba(255,255,255,0.75)', fontSize: 20 }}>active repositories</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
