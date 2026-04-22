from enum import StrEnum


class UserRole(StrEnum):
    ADMIN = "ADMIN"
    TEACHER = "TEACHER"
    STUDENT = "STUDENT"


class AcademicTerm(StrEnum):
    SPRING = "SPRING"
    SUMMER = "SUMMER"
    FALL = "FALL"


ROLE_VALUES = tuple(role.value for role in UserRole)
TERM_VALUES = tuple(term.value for term in AcademicTerm)

