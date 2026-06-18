package repository

import (
	"database/sql"
)

// NullStringToStr converts sql.NullString to string.
func NullStringToStr(ns sql.NullString) string {
	if ns.Valid {
		return ns.String
	}
	return ""
}

// StrToNullString converts string to sql.NullString.
func StrToNullString(s string) sql.NullString {
	return sql.NullString{
		String: s,
		Valid:  s != "",
	}
}

// NullBytesToBytes checks if bytes are nil and returns empty bytes instead.
func NullBytesToBytes(b []byte) []byte {
	if b == nil {
		return []byte{}
	}
	return b
}
