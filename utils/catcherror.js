

export default function catchError(res, error) {
    console.error(error);
    if (typeof error === 'string') {
        return res.status(500).json({
            error: {
                massage: error
            }
        })
    }
    return res.status(500).json({
        error: error
    })
}

export function namedErrorCatching(name, error) {
    if (typeof error !== 'object') {
        throw {
            type: name,
            massage :error
        }
    }
    throw {
        type: name,
        ...error
    }
} 