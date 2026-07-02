import { signToken } from './jwtUtils.js';
import { UserModel } from './userModel.js';

const userModel = new UserModel();

export function login(email, password) {
    const user = userModel.findUser(email);
    if (user && password === 'secret') {
        return signToken({ id: user.id });
    }
    return null;
}
