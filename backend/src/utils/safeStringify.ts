export function safeStringify(data: any) {
    return JSON.stringify(
        data,
        (_, value) =>
            typeof value === "bigint"
                ? value.toString()  // convert BigInt to string
                : value,
        2
    );
}
