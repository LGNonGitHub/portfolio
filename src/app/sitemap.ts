import type { MetadataRoute } from 'next';
import { site, projects } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site.url,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    // The case studies are real URLs the modal hands out, so they belong in
    // the sitemap rather than existing only as a share target.
    ...projects.map((project) => ({
      url: `${site.url}/work/${project.id}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
