import prisma from '@repo/db';
import emitNotification from './emitNotification';

export default async function spikeCheck(siteId: string) {
  try {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      console.log(`❌ Site not found: ${siteId}`);
      return;
    }
    if(site?.viewsIn5min === undefined || site?.expectedViewsIn5min === undefined) {
      console.log(`⚠ Missing viewsIn5min or expectedViewsIn5min for site: ${siteId}`);
      return;
    }
    if(site?.viewsIn5min == null || site?.expectedViewsIn5min == null) {
      console.log(`⚠ Null viewsIn5min or expectedViewsIn5min for site: ${siteId}`);
      return;
    }

    if (site?.viewsIn5min >= site?.expectedViewsIn5min) {

      const difference = site?.viewsIn5min - site?.expectedViewsIn5min;

      await emitNotification({
        siteId: site?.id,
        viewsIn5min: site?.viewsIn5min,
        expectedViews: site?.expectedViewsIn5min,
        difference
      });
      
    }

    await prisma.site.update({
      where: { id: siteId },
      data: { viewsIn5min: 0 },
    });

  } catch (error) {
    console.error(`❌ spikeCheck failed for siteId ${siteId}:`, error);
  }
}