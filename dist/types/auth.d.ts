export type PartialAuth<T> = {
    id: string;
    email?: string;
    token: string;
    decoded: T;
};
