import type {Metadata} from 'next';
export const metadata:Metadata={title:'Pink Rose | Yönetim Paneli',robots:{index:false,follow:false},openGraph:{title:'Pink Rose Yönetim Paneli'}};
export default function PanelLayout({children}:{children:React.ReactNode}){return children;}
