/** Ошибка, которую стоит показать пользователю (4xx бэкенда или моков). */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}
