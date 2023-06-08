import { JwtPayload } from '.';

export type JwtPayloadWithRefresh = JwtPayload & { refreshToken: string };
