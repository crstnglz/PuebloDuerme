export interface NewUser {
nickname: string;
email: string;
password: string;
password_confirmation: string;
rol?: "admin" | "user";
}