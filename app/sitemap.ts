import type {MetadataRoute} from 'next';
export default function sitemap():MetadataRoute.Sitemap{return [{url:'https://www.pinkrosecafe.com.tr',changeFrequency:'weekly',priority:1},{url:'https://www.pinkrosecafe.com.tr/linkler',changeFrequency:'monthly',priority:0.5}];}
