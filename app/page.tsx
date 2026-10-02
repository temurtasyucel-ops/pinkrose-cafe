import type {Metadata} from 'next';
export const metadata:Metadata={alternates:{canonical:'https://www.pinkrosecafe.com.tr'}};
import Storefront from './storefront';
export default function Page(){return <Storefront/>;}
