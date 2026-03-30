import { makeHandler } from "../../middlewares/makeHandler";
import { Success } from "../../../../shared/utils/Result";

// Static categories — có thể chuyển sang DynamoDB sau nếu cần quản lý động
const CATEGORIES = [
    { id: "vpop",   name: "V-Pop",       color: "bg-red-500" },
    { id: "pop",    name: "Pop",          color: "bg-blue-600" },
    { id: "kpop",   name: "K-Pop",        color: "bg-pink-500" },
    { id: "ballad", name: "Ballad",       color: "bg-orange-800" },
    { id: "rap",    name: "Rap/Hip-Hop",  color: "bg-orange-500" },
    { id: "indie",  name: "Indie",        color: "bg-purple-600" },
    { id: "rnb",    name: "R&B",          color: "bg-indigo-600" },
    { id: "edm",    name: "EDM",          color: "bg-teal-500" },
];

export const handler = makeHandler(async () => {
    return Success(CATEGORIES);
});
