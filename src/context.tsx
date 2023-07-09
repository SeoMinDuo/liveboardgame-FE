import { createContext, useState, ReactNode, useContext } from "react";
type LoginInfoType = {
    isLogin: boolean;
    id?: string;
};
interface LoginContextProps {
    loginInfo: LoginInfoType;
    updateLoginInfo: (id: string) => void;
}
const LoginContext = createContext<LoginContextProps>({
    loginInfo: {
        isLogin: false,
    },
    updateLoginInfo: () => {},
});

export const useLoginContext = (): LoginContextProps => {
    const contextValue = useContext(LoginContext);
    if (!contextValue) throw new Error("useLoginContext must be used within a LoginProvider");

    return contextValue;
};
export const LoginProvider: React.FC<{ children?: ReactNode }> = ({ children }) => {
    const [loginInfo, setLoginInfo] = useState<LoginInfoType>({ isLogin: false });

    const updateLoginInfo = (id: string) => {
        if (id == null) throw new Error("[updateLoginInfo] no id");
        setLoginInfo({
            isLogin: true,
            id,
        });
    };
    return <LoginContext.Provider value={{ loginInfo, updateLoginInfo }}>{children}</LoginContext.Provider>;
};
