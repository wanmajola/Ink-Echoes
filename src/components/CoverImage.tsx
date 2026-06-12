/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getCoverImageSrc } from '../lib/coverImage';

interface CoverImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
}

export const CoverImage: React.FC<CoverImageProps> = ({ src, alt, className, ...props }) => {
  const [failed, setFailed] = useState(false);
  const resolved = failed ? getCoverImageSrc('') : getCoverImageSrc(src);

  return (
    <img
      {...props}
      src={resolved}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
};
