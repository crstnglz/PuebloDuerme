export interface UpdateUserBody {
nickname?: string;
email?: string;
password?: string;
password_confirmation?: string; 
rol?: "admin" | "user";
}