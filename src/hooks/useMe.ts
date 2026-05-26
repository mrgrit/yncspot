import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import type { User } from "@/types";

/** 현재 로그인한 참여자(youth)의 실시간 User 레코드 */
export function useMe(): User {
  const { account } = useAuth();
  const { db } = useData();
  const me = db.users.find((u) => u.id === account?.userId);
  // Protected(roles=['youth']) 하위에서만 사용되므로 사실상 항상 존재
  return me ?? db.users[0];
}
