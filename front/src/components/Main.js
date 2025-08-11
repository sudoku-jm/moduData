import Layout from "../Layout";
import Market from "./market/market";

const Main = ({ title }) => {
    return (
        <Layout pageTitle={title}>
            <Market />
        </Layout>
    );
};

export default Main;
