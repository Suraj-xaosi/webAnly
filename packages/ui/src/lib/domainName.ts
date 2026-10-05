export function getDisplayDomainName(domainName: string): string {
  return domainName.length > 3 ? domainName.slice(0, -3) : domainName
}
