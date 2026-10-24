import { apiClient } from "@/lib/api/client";
import type { MasterItem, MasterKind, MasterPageMeta, MasterPageParams } from "../types/master-data";
type Envelope<T>={data:T;meta:Record<string,unknown>};
export const masterDataApi={
 list:async(kind:MasterKind,params:MasterPageParams)=>{const result=await apiClient.get<Envelope<MasterItem[]>>(`/admin/master-data/${kind}/page`,{params});return{data:result.data.data,meta:result.data.meta as MasterPageMeta}},
 create:(kind:MasterKind,input:{name:string;code?:string;active?:boolean})=>apiClient.post<Envelope<MasterItem>>(`/admin/master-data/${kind}`,input).then(r=>r.data.data),
 update:(kind:MasterKind,id:string,input:{name?:string;code?:string;active?:boolean})=>apiClient.patch<Envelope<MasterItem>>(`/admin/master-data/${kind}/${id}`,input).then(r=>r.data.data),
 reorder:(kind:MasterKind,ids:string[])=>apiClient.put<Envelope<MasterItem[]>>(`/admin/master-data/${kind}/order`,{ids}).then(r=>r.data.data),
};
