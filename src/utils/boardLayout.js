export const MOBILE_COLUMNS = 3

export function transposeSquares(squares, columns = MOBILE_COLUMNS) {
  const rows = Math.ceil(squares.length / columns)
  const matrix = []

  for (let row = 0; row < rows; row++) {
    matrix.push(squares.slice(row * columns, (row + 1) * columns))
  }

  const transposed = []
  for (let column = 0; column < columns; column++) {
    for (let row = 0; row < rows; row++) {
      if (matrix[row][column]) {
        transposed.push(matrix[row][column])
      }
    }
  }

  return transposed
}

