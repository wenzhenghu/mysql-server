/*
   Copyright (c) 2010, 2015, Oracle and/or its affiliates. All rights reserved.

   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License, version 2.0,
   as published by the Free Software Foundation.

   This program is also distributed with certain software (including
   but not limited to OpenSSL) that is licensed under separate terms,
   as designated in a particular file or component or in included license
   documentation.  The authors of MySQL hereby grant you an additional
   permission to link the program and your derivative works with the
   separately licensed software that they have included with MySQL.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License, version 2.0, for more details.

   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
*/

package com.mysql.clusterj;

public abstract class DynamicObject {

    private DynamicObjectDelegate delegate;

    public String table() {
        return null;
    }

    public final void delegate(DynamicObjectDelegate delegate) {
        this.delegate = delegate;
    }

    public final DynamicObjectDelegate delegate() {
        return delegate;
    }

    public final Object get(int columnNumber) {
        return delegate.get(columnNumber);
    }

    public final void set(int columnNumber, Object value) {
        delegate.set(columnNumber, value);
    }

    public final ColumnMetadata[] columnMetadata() {
        return delegate.columnMetadata();
    }

    public Boolean found() {
        return delegate.found();
    }

    protected void finalize() throws Throwable {
        try {
            if (delegate != null) {
                delegate.release();
            }
        } finally {
            super.finalize();
        }
    }
}
