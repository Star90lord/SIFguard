from typing import List


def chunk_tokens(
    tokens: List[str],
    max_length: int = 512,
    overlap: int = 50
) -> List[List[str]]:
    """
    Split tokens into overlapping chunks.

    The overlap helps preserve entities that may span
    a chunk boundary.
    """

    if not isinstance(tokens, list):
        raise TypeError("tokens must be a list.")

    if max_length <= 0:
        raise ValueError("max_length must be greater than 0.")

    if overlap < 0:
        raise ValueError("overlap cannot be negative.")

    if overlap >= max_length:
        raise ValueError(
            "overlap must be smaller than max_length."
        )

    if not tokens:
        return []

    chunks = []

    start = 0

    step = max_length - overlap

    while start < len(tokens):
        end = start + max_length

        chunk = tokens[start:end]

        if chunk:
            chunks.append(chunk)

        start += step

    return chunks